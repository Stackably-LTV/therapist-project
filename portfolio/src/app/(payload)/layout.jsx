/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config';
import '@payloadcms/next/css';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import React from 'react';
import { importMap } from '@/components/8cf826d274d5';
import './custom.scss';
const serverFunction = async function (args) {
    'use server';
    return handleServerFunctions({
        ...args,
        config,
        importMap,
    });
};
const Layout = ({ children }) => (<RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>);
export default Layout;
