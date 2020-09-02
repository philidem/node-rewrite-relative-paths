import { formatUtil } from '../src/util';

export default function () {
  return formatUtil.toLowerCase('TEST') + ' ' + formatUtil.toUpperCase('test');
}
