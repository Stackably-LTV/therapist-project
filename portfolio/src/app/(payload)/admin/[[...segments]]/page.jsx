import config from '@payload-config';
import { RootPage, generatePageMetadata } from '@payloadcms/next/views';
import { importMap } from '@/components/8cf826d274d5';
export const generateMetadata = ({ params, searchParams }) => generatePageMetadata({ config, params, searchParams });
const Page = ({ params, searchParams }) => RootPage({ config, params, searchParams, importMap });
export default Page;
