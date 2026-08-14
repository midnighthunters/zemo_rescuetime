Pod::Spec.new do |s|
  s.name             = 'RescueHealthKit'
  s.version          = '1.0.0'
  s.summary          = 'Swift HealthKit step-count bridge for Rescue Animals Steps'
  s.description      = 'Provides the app with availability, authorization, and daily step-count access through HealthKit.'
  s.license          = { :type => 'MIT' }
  s.author           = 'Zemo Labs'
  s.homepage         = 'https://github.com/midnighthunters/zemo_animal_rescue'
  s.platforms        = { :ios => '16.0' }
  s.swift_version    = '5.9'
  # CocoaPods uses this pod through Expo's local :path autolinking, so the
  # source URL is metadata only and is never fetched during an app build.
  s.source           = { :git => 'https://github.com/midnighthunters/zemo_animal_rescue.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'HealthKit'
  s.source_files = '**/*.swift'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
