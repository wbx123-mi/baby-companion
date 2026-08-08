import type { GrowthRecordContract } from "@baby-companion/contracts";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthContext } from "../common/request-context";
import { CreateRecordDto } from "./dto/create-record.dto";
import { DeleteRecordDto } from "./dto/delete-record.dto";
import { ListRecordsDto } from "./dto/list-records.dto";
import { UpdateRecordDto } from "./dto/update-record.dto";
import { RecordsService } from "./records.service";

@ApiTags("records")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("records")
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  @ApiOperation({ summary: "获取当前家庭宝宝的成长记录" })
  list(@CurrentUser() context: AuthContext, @Query() input: ListRecordsDto): Promise<GrowthRecordContract[]> {
    return this.recordsService.list(context.userId, input);
  }

  @Get(":recordId")
  @ApiOperation({ summary: "获取成长记录详情" })
  getById(@CurrentUser() context: AuthContext, @Param("recordId") recordId: string): Promise<GrowthRecordContract> {
    return this.recordsService.getById(context.userId, recordId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建纯文字成长记录" })
  create(@CurrentUser() context: AuthContext, @Body() input: CreateRecordDto): Promise<GrowthRecordContract> {
    return this.recordsService.create(context.userId, input);
  }

  @Put(":recordId")
  @ApiOperation({ summary: "更新成长记录" })
  update(
    @CurrentUser() context: AuthContext,
    @Param("recordId") recordId: string,
    @Body() input: UpdateRecordDto,
  ): Promise<GrowthRecordContract> {
    return this.recordsService.update(context.userId, recordId, input);
  }

  @Delete(":recordId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "软删除成长记录" })
  remove(
    @CurrentUser() context: AuthContext,
    @Param("recordId") recordId: string,
    @Body() input: DeleteRecordDto,
  ): Promise<null> {
    return this.recordsService.remove(context.userId, recordId, input);
  }
}
