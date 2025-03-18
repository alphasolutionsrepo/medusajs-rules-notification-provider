import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import RulesNotificationProviderService from "./services/rules";

const services = [RulesNotificationProviderService];

export default ModuleProvider(Modules.NOTIFICATION, {
  services,
});
