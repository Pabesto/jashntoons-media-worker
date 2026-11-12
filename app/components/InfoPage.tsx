import {BrandLogo} from './BrandLogo';
import {ArrowUpRight} from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './info-page.module.css';

export default function InfoPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <main className={styles.page}>
    <header><a href="/" className={styles.brand} aria-label="Jashntoons home"><BrandLogo/></a><a href="/">Back to the studio <ArrowUpRight size={15} aria-hidden="true"/></a></header>
    <article><p className={styles.eyebrow}>YOUR CELEBRATIONS, YOUR CHOICE</p><h1>{title}</h1><p className={styles.intro}>{intro}</p><p className={styles.date}>Updated 11 November 2026</p>{children}</article>
    <footer><span>© 2026 Jashntoons</span><nav aria-label="Information"><a href="/privacy">Privacy policy</a><a href="/terms">Terms of use</a><a href="mailto:pabesto99@gmail.com">Contact us</a></nav></footer>
  </main>;
}
