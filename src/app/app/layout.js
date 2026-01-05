import AppLayout from '../../components/AppLayout';

export default function AppRootLayout({ children }) {
    return (
        <AppLayout>
            {children}
        </AppLayout>
    );
}
