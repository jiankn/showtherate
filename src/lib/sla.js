/**
 * SLA 计算引擎
 * 支持加州工时（America/Los_Angeles）
 * 8小时首次响应，工作日 9:00-18:00
 */

// 默认SLA配置
export const DEFAULT_CONFIG = {
    timezone: 'America/Los_Angeles',
    workdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    workStart: 9,  // 9:00 AM
    workEnd: 18,   // 6:00 PM
    firstResponseHours: 8,
    warnThreshold1: 120,  // 2小时
    warnThreshold2: 30,   // 30分钟
    holidays: [],
};

// 周几名称映射
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * 获取指定时区的当前时间
 */
export function getNowInTimezone(timezone = DEFAULT_CONFIG.timezone) {
    return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
}

/**
 * 将UTC时间转换为指定时区时间
 */
export function toTimezone(date, timezone = DEFAULT_CONFIG.timezone) {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 判断是否为节假日
 */
export function isHoliday(date, holidays = []) {
    const dateStr = formatDate(date);
    return holidays.includes(dateStr);
}

/**
 * 判断是否为工作日
 */
export function isWorkday(date, config = DEFAULT_CONFIG) {
    const dayName = DAY_NAMES[date.getDay()];
    if (!config.workdays.includes(dayName)) {
        return false;
    }
    if (isHoliday(date, config.holidays)) {
        return false;
    }
    return true;
}

/**
 * 判断当前时间是否在工作时段内
 */
export function isWorkingHours(date, config = DEFAULT_CONFIG) {
    if (!isWorkday(date, config)) {
        return false;
    }
    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeInMinutes = hour * 60 + minute;
    const startMinutes = config.workStart * 60;
    const endMinutes = config.workEnd * 60;
    return timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
}

/**
 * 获取下一个工作时段开始时间
 */
export function getNextWorkStart(date, config = DEFAULT_CONFIG) {
    const result = new Date(date);

    // 如果当前在工作时段内，返回当前时间
    if (isWorkingHours(result, config)) {
        return result;
    }

    // 检查今天是否还有工作时间
    const today = new Date(result);
    today.setHours(config.workStart, 0, 0, 0);

    if (isWorkday(result, config)) {
        const hour = result.getHours();
        // 如果还没到工作时间开始
        if (hour < config.workStart) {
            return today;
        }
    }

    // 找下一个工作日
    result.setDate(result.getDate() + 1);
    result.setHours(config.workStart, 0, 0, 0);

    // 循环找到下一个工作日（最多检查14天）
    for (let i = 0; i < 14; i++) {
        if (isWorkday(result, config)) {
            return result;
        }
        result.setDate(result.getDate() + 1);
    }

    // 兜底：返回当前时间 + 下周一
    return result;
}

/**
 * 计算两个时间点之间的工作分钟数
 */
export function calculateWorkMinutes(startDate, endDate, config = DEFAULT_CONFIG) {
    if (startDate >= endDate) {
        return 0;
    }

    let totalMinutes = 0;
    const current = new Date(startDate);
    const workMinutesPerDay = (config.workEnd - config.workStart) * 60;

    while (current < endDate) {
        if (isWorkday(current, config)) {
            const hour = current.getHours();
            const minute = current.getMinutes();

            // 计算当天剩余工作分钟数
            if (hour < config.workStart) {
                // 还没开始工作
                current.setHours(config.workStart, 0, 0, 0);
            } else if (hour >= config.workEnd) {
                // 今天工作结束，跳到明天
                current.setDate(current.getDate() + 1);
                current.setHours(0, 0, 0, 0);
                continue;
            }

            // 当天工作结束时间
            const todayEnd = new Date(current);
            todayEnd.setHours(config.workEnd, 0, 0, 0);

            // 取较早的结束时间
            const effectiveEnd = endDate < todayEnd ? endDate : todayEnd;

            if (effectiveEnd > current) {
                const minutes = Math.floor((effectiveEnd - current) / 60000);
                totalMinutes += minutes;
            }

            // 跳到下一天
            current.setDate(current.getDate() + 1);
            current.setHours(0, 0, 0, 0);
        } else {
            // 非工作日，跳到下一天
            current.setDate(current.getDate() + 1);
            current.setHours(0, 0, 0, 0);
        }
    }

    return totalMinutes;
}

/**
 * 从给定时间点向后加工作分钟数，计算截止时间
 */
export function addWorkMinutes(startDate, minutes, config = DEFAULT_CONFIG) {
    let remaining = minutes;
    const current = new Date(startDate);

    // 如果不在工作时段，先调整到下一个工作时段开始
    if (!isWorkingHours(current, config)) {
        const nextStart = getNextWorkStart(current, config);
        current.setTime(nextStart.getTime());
    }

    // 安全计数器，防止无限循环
    let iterations = 0;
    const maxIterations = 365;

    while (remaining > 0 && iterations < maxIterations) {
        iterations++;

        if (!isWorkday(current, config)) {
            current.setDate(current.getDate() + 1);
            current.setHours(config.workStart, 0, 0, 0);
            continue;
        }

        const hour = current.getHours();

        // 调整到工作时间开始
        if (hour < config.workStart) {
            current.setHours(config.workStart, 0, 0, 0);
        } else if (hour >= config.workEnd) {
            current.setDate(current.getDate() + 1);
            current.setHours(config.workStart, 0, 0, 0);
            continue;
        }

        // 计算当天剩余工作分钟数
        const todayEnd = new Date(current);
        todayEnd.setHours(config.workEnd, 0, 0, 0);
        const todayRemaining = Math.floor((todayEnd - current) / 60000);

        if (remaining <= todayRemaining) {
            // 今天就能完成
            current.setTime(current.getTime() + remaining * 60000);
            remaining = 0;
        } else {
            // 今天不够，消耗完今天的，跳到明天
            remaining -= todayRemaining;
            current.setDate(current.getDate() + 1);
            current.setHours(config.workStart, 0, 0, 0);
        }
    }

    return current;
}

/**
 * 计算SLA截止时间（首次响应）
 */
export function calculateSLADeadline(createdAt, config = DEFAULT_CONFIG) {
    const createdDate = new Date(createdAt);
    const tzDate = toTimezone(createdDate, config.timezone);
    const responseMinutes = config.firstResponseHours * 60;
    return addWorkMinutes(tzDate, responseMinutes, config);
}

/**
 * 计算SLA剩余工作分钟数
 */
export function calculateSLARemaining(deadline, config = DEFAULT_CONFIG) {
    const now = getNowInTimezone(config.timezone);
    const deadlineDate = new Date(deadline);
    const tzDeadline = toTimezone(deadlineDate, config.timezone);

    if (now >= tzDeadline) {
        return 0;  // 已超时
    }

    return calculateWorkMinutes(now, tzDeadline, config);
}

/**
 * 获取SLA状态
 */
export function getSLAStatus(deadline, config = DEFAULT_CONFIG) {
    const remaining = calculateSLARemaining(deadline, config);

    if (remaining <= 0) {
        return 'overdue';
    } else if (remaining <= config.warnThreshold2) {
        return 'warn';  // 30分钟内
    } else if (remaining <= config.warnThreshold1) {
        return 'warn';  // 2小时内
    }
    return 'normal';
}

/**
 * Format remaining time
 */
export function formatRemaining(minutes) {
    if (minutes <= 0) {
        return 'Overdue';
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h${mins > 0 ? ' ' + mins + 'm' : ''}`;
    }
    return `${mins}m`;
}

export default {
    getNowInTimezone,
    toTimezone,
    formatDate,
    isHoliday,
    isWorkday,
    isWorkingHours,
    getNextWorkStart,
    calculateWorkMinutes,
    addWorkMinutes,
    calculateSLADeadline,
    calculateSLARemaining,
    getSLAStatus,
    formatRemaining,
    DEFAULT_CONFIG,
};
