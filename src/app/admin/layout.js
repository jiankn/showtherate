import { Space_Grotesk, Sora } from "next/font/google";
import styles from "./admin.module.css";

const adminBody = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-admin-body",
});

const adminDisplay = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-admin-display",
});

export const metadata = {
  title: "ShowTheRate Admin",
  description: "ShowTheRate admin console",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }) {
  return (
    <section className={`${styles.adminRoot} ${adminBody.variable} ${adminDisplay.variable}`}>
      {children}
    </section>
  );
}
