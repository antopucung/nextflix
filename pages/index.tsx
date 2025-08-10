/* eslint-disable @next/next/no-img-element */
import Head from 'next/head';
import { NextRouter, useRouter } from 'next/router';

import styles from '../styles/Login.module.scss';
import { ROUTES } from '../config/route';

export default function Home(): React.ReactElement {
  const router: NextRouter = useRouter();

  const onSignIn = () => {
    router.push(ROUTES.BROWSE)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Arsip Galleri</title>
        <meta name='description' content='Netflix clone, made using Next.js' />
        <link rel='icon' href='/assets/logo-anri.jpg' />
      </Head>

      <main className={styles.main}>
        <div className={styles.bg} />
        <div className={styles.main__card}>
          <img src='/assets/logo-anri.jpg' alt='ANRI' className={styles.brandLogoLg} />
          <p className={styles.lede}>
            Pancasila sejak tanggal 1 Juni 1945 yang dipidatokan Ir. Soekarno, rumusan Piagam Jakarta tanggal 22 Juni 1945 hingga rumusan final tanggal 18 Agustus 1945 adalah satu kesatuan proses lahirnya Pancasila sebagai Dasar Negara;
          </p>
          <div className={styles.button} onClick={onSignIn}>Enter</div>
        </div>
      </main>
    </div>
  );
}
