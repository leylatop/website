import clsx from 'clsx';

import React from 'react';
import Layout from '@theme/Layout';
import styles from './index.module.css';

export default function Tool() {
  return (
    <Layout title="工具" description="工具">
      <div className={clsx("container", styles.customContainer)}>
        <h1>工具集合</h1>
        <div>
          <a href="/tool/ai-generate-px-area.html">ai-generate-px-area.html</a><br />
          <a href="/tool/mp4转gif.html">mp4转gif.html</a><br />
          <a href="/tool/公证收费计算器.html">公证收费计算器.html</a><br />
          <a href="/tool/进制转换器.html">进制转换器.html</a><br />
          <a href="/tool/英语单词听力练习.html">英语单词听力练习.html</a>
        </div>
      </div>
    </Layout>
  );
}
