/** Ordinary release entry; qualification imports the environment-independent factory. */
import { createElectronBuilderConfig, PRODUCT_NAME } from './scripts/electron-builder-config.mjs'

export { createElectronBuilderConfig, PRODUCT_NAME }
export default createElectronBuilderConfig()
