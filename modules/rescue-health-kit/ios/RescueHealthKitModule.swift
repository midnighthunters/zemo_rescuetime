import ExpoModulesCore
import HealthKit

public final class RescueHealthKitModule: Module {
  private let healthStore = HKHealthStore()

  public func definition() -> ModuleDefinition {
    Name("RescueHealthKit")

    Function("isAvailable") {
      HKHealthStore.isHealthDataAvailable()
    }

    AsyncFunction("getAuthorizationRequestStatus") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.reject(
          "ERR_HEALTHKIT_UNAVAILABLE",
          "Apple Health is not available on this device."
        )
        return
      }

      guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
        promise.reject(
          "ERR_HEALTHKIT_STEP_TYPE_UNAVAILABLE",
          "HealthKit could not create the step-count data type."
        )
        return
      }

      self.healthStore.getRequestStatusForAuthorization(
        toShare: Set<HKSampleType>(),
        read: Set<HKObjectType>([stepType])
      ) { status, error in
        if let error {
          promise.reject(
            "ERR_HEALTHKIT_AUTHORIZATION_STATUS",
            "Apple Health authorization status could not be checked: \(error.localizedDescription)"
          )
          return
        }

        switch status {
        case .shouldRequest:
          promise.resolve("shouldRequest")
        case .unnecessary:
          promise.resolve("unnecessary")
        case .unknown:
          promise.resolve("unknown")
        @unknown default:
          promise.resolve("unknown")
        }
      }
    }

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.reject(
          "ERR_HEALTHKIT_UNAVAILABLE",
          "Apple Health is not available on this device."
        )
        return
      }

      guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
        promise.reject(
          "ERR_HEALTHKIT_STEP_TYPE_UNAVAILABLE",
          "HealthKit could not create the step-count data type."
        )
        return
      }

      self.healthStore.requestAuthorization(
        toShare: Set<HKSampleType>(),
        read: Set<HKObjectType>([stepType])
      ) { success, error in
        if let error {
          promise.reject(
            "ERR_HEALTHKIT_AUTHORIZATION",
            "Apple Health authorization failed: \(error.localizedDescription)"
          )
          return
        }

        guard success else {
          promise.reject(
            "ERR_HEALTHKIT_AUTHORIZATION_INCOMPLETE",
            "Apple Health did not complete the authorization request."
          )
          return
        }

        // A successful request means the authorization sheet completed. For
        // privacy, HealthKit deliberately does not reveal whether read access
        // was granted or denied; a denied read behaves like an empty store.
        promise.resolve(nil)
      }
    }.runOnQueue(.main)

    AsyncFunction("getTodayStepCount") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.reject(
          "ERR_HEALTHKIT_UNAVAILABLE",
          "Apple Health is not available on this device."
        )
        return
      }

      guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
        promise.reject(
          "ERR_HEALTHKIT_STEP_TYPE_UNAVAILABLE",
          "HealthKit could not create the step-count data type."
        )
        return
      }

      let now = Date()
      let startOfDay = Calendar.current.startOfDay(for: now)
      let datePredicate = HKQuery.predicateForSamples(
        withStart: startOfDay,
        end: now,
        options: .strictStartDate
      )
      let automaticStepsPredicate = HKQuery.predicateForObjects(
        withMetadataKey: HKMetadataKeyWasUserEntered,
        operatorType: .notEqualTo,
        value: true
      )
      let predicate = NSCompoundPredicate(
        andPredicateWithSubpredicates: [datePredicate, automaticStepsPredicate]
      )

      let query = HKStatisticsQuery(
        quantityType: stepType,
        quantitySamplePredicate: predicate,
        options: .cumulativeSum
      ) { _, result, error in
        if let error {
          promise.reject(
            "ERR_HEALTHKIT_STEP_QUERY",
            "Apple Health could not read today's steps: \(error.localizedDescription)"
          )
          return
        }

        let steps = result?.sumQuantity()?.doubleValue(for: .count()) ?? 0
        promise.resolve(max(0, Int(steps.rounded())))
      }

      self.healthStore.execute(query)
    }
  }
}
