import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  INotificationModuleService,
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";

type InjectedDependencies = {
  logger: Logger;
  notificationModuleService: INotificationModuleService;
};

type Options = {
  forwardChannel: string;
  env?: string;
  toMatchPattern?: string;
  overrideToOnMatch?: string;
  overrideToOnMismatch?: string;
};

class RulesNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "rules-notification";
  protected logger_: Logger;
  protected options_: Options;
  protected notificationModuleService_: INotificationModuleService;

  constructor(dependencies: InjectedDependencies, options: Options) {
    super();
    this.logger_ = dependencies.logger;
    this.options_ = options;
    this.notificationModuleService_ = dependencies.notificationModuleService;
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.forwardChannel) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "forwardChannel is required in the provider's options."
      );
    }

    // Determine the runtime environment: use the provided env, or fall back to NODE_ENV
    const currentEnv = options.env || process.env.NODE_ENV;

    // In development, if a regex pattern is provided, both override options must be provided
    if (currentEnv === "development" && options.toMatchPattern) {
      if (!options.overrideToOnMatch) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "overrideToOnMatch is required when toMatchPattern is provided in development."
        );
      }
      if (!options.overrideToOnMismatch) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "overrideToOnMismatch is required when toMatchPattern is provided in development."
        );
      }
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    let finalTo = notification.to;

    // Determine the environment: use the provided env, or fall back to NODE_ENV
    const currentEnv = this.options_.env || process.env.NODE_ENV;

    // Development-only behavior: check for regex pattern and override accordingly
    if (currentEnv === "development" && this.options_.toMatchPattern) {
      const regex = new RegExp(this.options_.toMatchPattern);
      if (regex.test(notification.to)) {
        this.logger_.info(
          `notification.to matches pattern. Overriding "to" with overrideToOnMatch: ${this.options_.overrideToOnMatch}`
        );
        finalTo = this.options_.overrideToOnMatch!;
      } else {
        this.logger_.info(
          `notification.to does not match pattern. Overriding "to" with overrideToOnMismatch: ${this.options_.overrideToOnMismatch}`
        );
        finalTo = this.options_.overrideToOnMismatch!;
      }
    }

    await this.notificationModuleService_.createNotifications({
      to: finalTo,
      channel: this.options_.forwardChannel,
      template: notification.template,
      data: notification.data,
    });

    return {};
  }
}

export default RulesNotificationProviderService;
