/**
 * Generated from the installed Expo modules.
 *
 * This project was missing Expo's generated provider build phase, so its Swift
 * modules were compiled but never registered at runtime. Keep this file in the
 * app target until the native project is regenerated with Expo autolinking.
 */

import ExpoModulesCore
import Expo
import EXApplication
import ExpoAsset
import EXAV
import EXConstants
import ExpoDevice
import ExpoFileSystem
import ExpoFont
import ExpoHaptics
import ExpoImage
import ExpoKeepAwake
import ExpoLinearGradient
import ExpoLinking
import EXNotifications
import ExpoHead
import ExpoSensors
import ExpoSpeech
import ExpoSplashScreen
import ExpoSystemUI
import RescueHealthKit

@objc(ExpoModulesProvider)
public class ExpoModulesProvider: ModulesProvider {
  public override func getModuleClasses() -> [AnyModule.Type] {
    return [
      ExpoFetchModule.self,
      ApplicationModule.self,
      AssetModule.self,
      VideoViewModule.self,
      ConstantsModule.self,
      DeviceModule.self,
      FileSystemModule.self,
      FileSystemLegacyModule.self,
      FontLoaderModule.self,
      FontUtilsModule.self,
      HapticsModule.self,
      ImageModule.self,
      KeepAwakeModule.self,
      LinearGradientModule.self,
      ExpoLinkingModule.self,
      BackgroundModule.self,
      BadgeModule.self,
      CategoriesModule.self,
      EmitterModule.self,
      HandlerModule.self,
      PermissionsModule.self,
      PresentationModule.self,
      PushTokenModule.self,
      SchedulerModule.self,
      ServerRegistrationModule.self,
      ExpoHeadModule.self,
      LinkPreviewNativeModule.self,
      AccelerometerModule.self,
      BarometerModule.self,
      DeviceMotionModule.self,
      GyroscopeModule.self,
      MagnetometerModule.self,
      MagnetometerUncalibratedModule.self,
      PedometerModule.self,
      SpeechModule.self,
      SplashScreenModule.self,
      ExpoSystemUIModule.self,
      RescueHealthKitModule.self
    ]
  }

  public override func getAppDelegateSubscribers() -> [ExpoAppDelegateSubscriber.Type] {
    return [
      FileSystemBackgroundSessionHandler.self,
      LinkingAppDelegateSubscriber.self,
      NotificationsAppDelegateSubscriber.self,
      ExpoHeadAppDelegateSubscriber.self,
      SplashScreenAppDelegateSubscriber.self
    ]
  }

  public override func getReactDelegateHandlers() -> [ExpoReactDelegateHandlerTupleType] {
    return []
  }

  public override func getAppCodeSignEntitlements() -> AppCodeSignEntitlements {
    return AppCodeSignEntitlements.from(json: #"{}"#)
  }
}
