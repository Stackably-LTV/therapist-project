import config from '@payload-config';
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views';
import { importMap } from '@/components/8cf826d274d5';
export const generateMetadata = ({ params, searchParams }) => generatePageMetadata({ config, params, searchParams });
const NotFound = ({ params, searchParams }) => NotFoundPage({ config, params, searchParams, importMap });
export default NotFound;
