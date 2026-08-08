import { Test, type TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get(AppController);
  });

  it("returns service metadata", () => {
    const response = controller.getServiceInfo();

    expect(response).toEqual({
      name: "baby-companion-api",
      version: "0.1.0",
      status: "ok",
    });
  });
});
