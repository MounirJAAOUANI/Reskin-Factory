export function generatePubspec(appName: string, packageId: string, version = '1.0.0+1'): string {
  return `name: ${appName.toLowerCase().replace(/\s+/g, '_')}
description: A new Flutter application.
publish_to: 'none'
version: ${version}

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
  google_mobile_ads: ^5.1.0
  firebase_core: ^3.1.0
  firebase_remote_config: ^5.0.0
  in_app_purchase: ^3.1.13
  shared_preferences: ^2.2.3
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
`;
}
