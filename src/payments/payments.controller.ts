import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService, CreatePaymentDto, RefundDto } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Получение баланса пользователя
   */
  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getUserBalance(@Request() req) {
    const userId = req.user.id; // Get user ID from JWT token
    const balance = await this.paymentsService.getUserBalance(userId);
    return { balance };
  }

  /**
   * Получение транзакций пользователя
   */
  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getUserTransactions(@Request() req, @Query('limit') limit?: string) {
    const userId = req.user.id; // Get user ID from JWT token
    const limitNum = limit ? parseInt(limit) : 50;
    return this.paymentsService.getUserTransactions(userId, limitNum);
  }

  /**
   * Получение истории платежей пользователя
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(@Request() req, @Query() filter: any) {
    const userId = req.user.userId;
    return this.paymentsService.getPaymentHistory(userId, filter);
  }

  /**
   * Получение доступных методов платежа
   */
  @Get('methods')
  async getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }

  /**
   * Создание нового платежа
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    const userId = req.user.id; // Get user ID from JWT token
    return this.paymentsService.createPayment(createPaymentDto, userId);
  }

  /**
   * Получение информации о платеже
   */
  @Get(':paymentId')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPayment(paymentId);
  }

  /**
   * Создание возврата
   */
  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async createRefund(@Body() refundDto: RefundDto, @Request() req) {
    const userId = req.user.userId;
    return this.paymentsService.createRefund(refundDto, userId);
  }

  /**
   * Webhook для получения уведомлений от YooKassa
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() webhookData: any) {
    return this.paymentsService.handleWebhook(webhookData);
  }

  /**
   * Заглушки для дополнительных эндпоинтов (для совместимости с фронтендом)
   */
  @Post('save-method')
  @UseGuards(JwtAuthGuard)
  async savePaymentMethod(@Body() body: { payment_method_id: string }, @Request() req) {
    // Заглушка для сохранения метода платежа
    return { success: true, message: 'Payment method saved' };
  }

  @Get('saved-methods')
  @UseGuards(JwtAuthGuard)
  async getSavedPaymentMethods(@Request() req) {
    // Заглушка для получения сохраненных методов
    return [];
  }

  @Post('create-with-saved')
  @UseGuards(JwtAuthGuard)
  async createPaymentWithSavedMethod(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    const userId = req.user.userId;
    return this.paymentsService.createPayment(createPaymentDto, userId);
  }

  /**
   * Симуляция успешного платежа (для тестирования)
   */
  @Post('simulate-success/:paymentId')
  @UseGuards(JwtAuthGuard)
  async simulatePaymentSuccess(@Param('paymentId') paymentId: string, @Request() req) {
    // Симулируем webhook от YooKassa с правильным user ID
    const mockWebhookData = {
      type: 'payment.succeeded',
      object: {
        id: paymentId,
        status: 'succeeded',
        amount: { value: '1000.00', currency: 'RUB' },
        metadata: { user_id: req.user.id } // Use real user ID from JWT
      }
    };
    
    return this.paymentsService.handleWebhook(mockWebhookData);
  }
} 