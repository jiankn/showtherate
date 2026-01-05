import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CACHE_TTL_DAYS = 30;

function normalizeAddress(address) {
    return address
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/,+/g, ',')
        .replace(/\s+,/g, ',')
        .replace(/,\s+/g, ', ')
        .trim();
}

function addDaysUtcMidnight(date, days) {
    const utcMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    return new Date(utcMidnight.getTime() + days * 24 * 60 * 60 * 1000);
}

function extractLatestTax(propertyRecord) {
    const taxes = propertyRecord?.propertyTaxes;
    if (!taxes || typeof taxes !== 'object') return { annualPropertyTax: null, taxYear: null };

    const years = Object.keys(taxes)
        .map((y) => Number(y))
        .filter((y) => Number.isFinite(y));

    if (!years.length) return { annualPropertyTax: null, taxYear: null };

    const latestYear = Math.max(...years);
    const latest = taxes[String(latestYear)];
    const total = typeof latest?.total === 'number' ? latest.total : null;

    return { annualPropertyTax: total, taxYear: total === null ? null : latestYear };
}

async function fetchRentCastProperty(address) {
    const apiKey = process.env.RENTCAST_API_KEY;
    if (!apiKey) {
        throw new Error('Missing RENTCAST_API_KEY');
    }

    const url = new URL('https://api.rentcast.io/v1/properties');
    url.searchParams.set('address', address);
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString(), {
        headers: {
            Accept: 'application/json',
            'X-Api-Key': apiKey,
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        const error = new Error(`RentCast error: ${res.status}`);
        error.status = res.status;
        error.body = text;
        throw error;
    }

    const data = await res.json();
    const record = Array.isArray(data) ? data[0] : Array.isArray(data?.data) ? data.data[0] : data;
    if (!record) {
        return null;
    }

    return record;
}

export async function POST(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        const { checkQuota, consumeQuota, QUOTA_TYPES } = await import('@/lib/entitlements');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const rawAddress = typeof body.address === 'string' ? body.address : '';
        const countryCode = typeof body.countryCode === 'string' ? body.countryCode : 'US';

        if (!rawAddress.trim()) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }

        if (countryCode !== 'US') {
            return NextResponse.json({ error: 'Unsupported country' }, { status: 400 });
        }

        const normalizedAddress = normalizeAddress(rawAddress);
        const now = new Date();

        const { data: cached } = await supabaseAdmin
            .from('property_cache')
            .select('payload_json, expires_at')
            .eq('normalized_address', normalizedAddress)
            .eq('country_code', countryCode)
            .gt('expires_at', now.toISOString())
            .single();

        if (cached?.payload_json) {
            return NextResponse.json({
                cached: true,
                provider: 'rentcast',
                normalizedAddress,
                countryCode,
                expiresAt: cached.expires_at,
                ...cached.payload_json,
            });
        }

        const quotaCheck = await checkQuota(session.user.id, QUOTA_TYPES.PROPERTY);
        if (!quotaCheck.hasQuota) {
            return NextResponse.json(
                { error: 'Property lookup quota exhausted', reason: quotaCheck.reason },
                { status: 402 }
            );
        }

        const record = await fetchRentCastProperty(rawAddress.trim());
        if (!record) {
            return NextResponse.json({ error: 'No property found for this address' }, { status: 404 });
        }

        const { annualPropertyTax, taxYear } = extractLatestTax(record);
        const hoaMonthly = typeof record?.hoa?.fee === 'number' ? record.hoa.fee : null;
        const formattedAddress = typeof record?.formattedAddress === 'string' ? record.formattedAddress : rawAddress.trim();

        const expiresAt = addDaysUtcMidnight(now, CACHE_TTL_DAYS).toISOString();

        const payload = {
            address: formattedAddress,
            annualPropertyTax,
            taxYear,
            hoaMonthly,
        };

        const { error: cacheError } = await supabaseAdmin
            .from('property_cache')
            .upsert(
                {
                    normalized_address: normalizedAddress,
                    country_code: countryCode,
                    provider: 'rentcast',
                    payload_json: payload,
                    expires_at: expiresAt,
                    fetched_at: now.toISOString(),
                },
                { onConflict: 'normalized_address,country_code' }
            );

        if (cacheError) {
            console.error('Property cache upsert error:', cacheError);
        }

        const idempotencyKey = `property_${normalizedAddress}_${countryCode}_${expiresAt}`;
        const consumeResult = await consumeQuota(
            session.user.id,
            QUOTA_TYPES.PROPERTY,
            normalizedAddress,
            idempotencyKey
        );

        if (!consumeResult.success && !consumeResult.alreadyConsumed) {
            return NextResponse.json(
                { error: 'Failed to consume quota', reason: consumeResult.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            cached: false,
            provider: 'rentcast',
            normalizedAddress,
            countryCode,
            expiresAt,
            remaining: consumeResult.remaining,
            ...payload,
        });
    } catch (error) {
        console.error('Property fetch POST error:', error);
        const status = typeof error?.status === 'number' ? error.status : 500;
        return NextResponse.json({ error: 'Internal server error' }, { status });
    }
}

