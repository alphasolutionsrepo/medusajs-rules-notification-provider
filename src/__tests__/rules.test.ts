import RulesNotificationProviderService from "../services/rules";
import { MedusaError } from "@medusajs/framework/utils";
import {
  INotificationModuleService,
  ProviderSendNotificationDTO,
} from "@medusajs/framework/types";

const mockNotificationModuleService: INotificationModuleService = {
  createNotifications: jest.fn().mockResolvedValue({}),
  retrieveNotification: jest.fn(),
  listNotifications: jest.fn(),
  listAndCountNotifications: jest.fn(),
};

const dependencies = {
  logger: console as any,
  notificationModuleService: mockNotificationModuleService,
};

describe("RulesNotificationProviderService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateOptions", () => {
    test("throws error if forwardChannel is missing", () => {
      expect(() => {
        RulesNotificationProviderService.validateOptions({});
      }).toThrowError(MedusaError);
    });

    test("does not throw if forwardChannel is provided", () => {
      expect(() => {
        RulesNotificationProviderService.validateOptions({
          forwardChannel: "email",
        });
      }).not.toThrow();
    });

    test("throws error in development when toMatchPattern is provided without overrideToOnMatch", () => {
      process.env.NODE_ENV = "development";
      expect(() => {
        RulesNotificationProviderService.validateOptions({
          forwardChannel: "email",
          toMatchPattern: "^.*$",
          overrideToOnMismatch: "nomatch@example.com",
        });
      }).toThrowError(MedusaError);
    });

    test("throws error in development when toMatchPattern is provided without overrideToOnMismatch", () => {
      process.env.NODE_ENV = "development";
      expect(() => {
        RulesNotificationProviderService.validateOptions({
          forwardChannel: "email",
          toMatchPattern: "^.*$",
          overrideToOnMatch: "match@example.com",
        });
      }).toThrowError(MedusaError);
    });
  });

  describe("send", () => {
    const baseNotification: ProviderSendNotificationDTO = {
      to: "user@example.com",
      channel: "rules",
      template: "test-template",
      data: { key: "value" },
    };

    test("uses original notification.to in production", async () => {
      process.env.NODE_ENV = "production";
      const options = { forwardChannel: "email" };
      const service = new RulesNotificationProviderService(
        dependencies,
        options
      );

      await service.send(baseNotification);

      expect(
        mockNotificationModuleService.createNotifications
      ).toHaveBeenCalledWith({
        to: baseNotification.to,
        channel: options.forwardChannel,
        template: baseNotification.template,
        data: baseNotification.data,
      });
    });

    test("overrides notification.to with overrideToOnMatch when regex matches in development", async () => {
      const options = {
        forwardChannel: "email",
        env: "development",
        toMatchPattern: "^user@",
        overrideToOnMatch: "match@example.com",
        overrideToOnMismatch: "nomatch@example.com",
      };
      const service = new RulesNotificationProviderService(
        dependencies,
        options
      );

      await service.send(baseNotification);

      expect(
        mockNotificationModuleService.createNotifications
      ).toHaveBeenCalledWith({
        to: "match@example.com",
        channel: options.forwardChannel,
        template: baseNotification.template,
        data: baseNotification.data,
      });
    });

    test("overrides notification.to with overrideToOnMismatch when regex does not match in development", async () => {
      const options = {
        forwardChannel: "email",
        env: "development",
        toMatchPattern: "^admin@",
        overrideToOnMatch: "match@example.com",
        overrideToOnMismatch: "nomatch@example.com",
      };
      const service = new RulesNotificationProviderService(
        dependencies,
        options
      );

      await service.send(baseNotification);

      expect(
        mockNotificationModuleService.createNotifications
      ).toHaveBeenCalledWith({
        to: "nomatch@example.com",
        channel: options.forwardChannel,
        template: baseNotification.template,
        data: baseNotification.data,
      });
    });
  });
});
