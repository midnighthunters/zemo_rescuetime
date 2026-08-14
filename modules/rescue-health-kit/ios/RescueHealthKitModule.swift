import ExpoModulesCore
import HealthKit

public final class RescueHealthKitModule: Module {
  private let healthStore = HKHealthStore()

  public func definition() -> ModuleDefinition {
    Name("RescueHealthKit")

    Function("isAvailable") {
      HKHealthStore.isHealthDataAvailable()
    }

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve(false)
        return
      }

      guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
        promise.reject(
          "ERR_HEALTHKIT_STEP_TYPE_UNAVAILABLE",
          "HealthKit could not create the step-count data type."
        )
        return
      }

      self.healthStore.requestAuthorization(toShare: [], read: [stepType]) { success, error in
        if let error {
          promise.reject(
            "ERR_HEALTHKIT_AUTHORIZATION",
            "Apple Health authorization failed: \(error.localizedDescription)"
          )
          return
        }

        promise.resolve(success)
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
