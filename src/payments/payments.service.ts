import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YooCheckout, ICreatePayment, ICreateRefund } from '@a2seven/yoo-checkout';
import { User } from '../users/entities/user.entity';
import { Transaction, TransactionType, TransactionStatus } from '../users/entities/transaction.entity';

export interface CreatePaymentDto {
  amount: {
    value: string;
    currency: 'RUB' | 'USD' | 'EUR';
  };
  payment_method_data?: {
    type: 'bank_card' | 'yoo_money' | 'qiwi' | 'webmoney' | 'alfabank' | 'sberbank';
  };
  payment_method_id?: string;
  confirmation: {
    type: 'redirect' | 'embedded';
    return_url?: string;
  };
  description: string;
  receipt?: {
    customer: {
      email?: string;
      phone?: string;
    };
    items: Array<{
      description: string;
      quantity: string;
      amount: {
        value: string;
        currency: 'RUB' | 'USD' | 'EUR';
      };
      vat_code: number;
    }>;
  };
  metadata?: Record<string, string>;
  capture?: boolean;
}

export interface RefundDto {
  payment_id: string;
  amount?: {
    value: string;
    currency: 'RUB' | 'USD' | 'EUR';
  };
  description?: string;
}

@Injectable()
export class PaymentsService {
  private yooCheckout: YooCheckout;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {
    // Инициализация YooCheckout клиента
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    
    if (shopId && secretKey && shopId !== 'your-shop-id' && secretKey !== 'your-secret-key') {
      this.yooCheckout = new YooCheckout({
        shopId,
        secretKey,
      });
      console.log('YooKassa initialized with real credentials');
    } else {
      console.warn('YooKassa credentials not configured, using mock mode for development');
      this.yooCheckout = null; // Will use mock responses
    }
  }

  /**
   * Создание нового платежа
   */
  async createPayment(createPaymentDto: CreatePaymentDto, userId: string) {
    try {
      console.log('Creating payment for userId:', userId);
      
      // Добавляем метаданные пользователя
      const paymentData = {
        ...createPaymentDto,
        metadata: {
          ...createPaymentDto.metadata,
          user_id: userId,
          timestamp: new Date().toISOString(),
        },
      };

      console.log('Payment metadata:', paymentData.metadata);

      // Если YooKassa не настроена, возвращаем мок данные для разработки
      if (!this.yooCheckout) {
        const mockPayment = {
          id: this.generateIdempotenceKey(),
          status: 'pending',
          amount: createPaymentDto.amount,
          description: createPaymentDto.description,
          created_at: new Date().toISOString(),
          confirmation: {
            type: 'redirect',
            confirmation_url: 'https://yoomoney.ru/checkout/payments/v2/contract?orderId=mock-order-id'
          },
          metadata: paymentData.metadata,
        };
        
        // Создаем транзакцию в базе данных
        await this.createTransactionRecord(
          userId,
          TransactionType.DEPOSIT,
          parseFloat(createPaymentDto.amount.value),
          createPaymentDto.description,
          mockPayment.id,
          TransactionStatus.PENDING
        );
        
        console.log('Mock payment created:', mockPayment);
        return mockPayment;
      }

      const payment = await this.yooCheckout.createPayment(paymentData as ICreatePayment, this.generateIdempotenceKey());
      
      // Здесь можно добавить сохранение платежа в базу данных
      // await this.savePaymentToDatabase(payment, userId);

      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new BadRequestException('Не удалось создать платеж');
    }
  }

  /**
   * Получение информации о платеже
   */
  async getPayment(paymentId: string) {
    try {
      // Если YooKassa не настроена, возвращаем мок данные
      if (!this.yooCheckout) {
        const mockPayment = {
          id: paymentId,
          status: 'succeeded', // Для демо всегда успешный
          amount: {
            value: '1000.00',
            currency: 'RUB'
          },
          description: 'Пополнение баланса CyberPark (Mock)',
          created_at: new Date().toISOString(),
        };
        
        console.log('Mock payment retrieved:', mockPayment);
        return mockPayment;
      }

      const payment = await this.yooCheckout.getPayment(paymentId);
      return payment;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw new BadRequestException('Платеж не найден');
    }
  }

  /**
   * Создание возврата
   */
  async createRefund(refundDto: RefundDto, userId: string) {
    try {
      const refund = await this.yooCheckout.createRefund({
        ...refundDto,
        description: refundDto.description || 'Возврат средств CyberPark',
      } as ICreateRefund, this.generateIdempotenceKey());

      // Здесь можно добавить логику обновления баланса пользователя
      // await this.updateUserBalance(userId, refund.amount);

      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw new BadRequestException('Не удалось создать возврат');
    }
  }

  /**
   * Получение истории платежей (заглушка для демонстрации)
   */
  async getPaymentHistory(userId: string, filter?: any) {
    try {
      // В реальном приложении здесь будет запрос к базе данных
      // const payments = await this.paymentRepository.find({
      //   where: { userId },
      //   ...filter
      // });

      // Пока возвращаем пустой массив как заглушку
      return {
        items: [],
        has_next: false,
        next_cursor: null,
      };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw new BadRequestException('Не удалось получить историю платежей');
    }
  }

  /**
   * Получение доступных методов платежа
   */
  async getPaymentMethods() {
    try {
      // YooKassa поддерживает различные методы платежа
      return [
        { type: 'bank_card', name: 'Банковская карта' },
        { type: 'yoo_money', name: 'ЮMoney' },
        { type: 'qiwi', name: 'QIWI Кошелек' },
        { type: 'sberbank', name: 'Сбербанк Онлайн' },
        { type: 'alfabank', name: 'Альфа-Клик' },
        { type: 'webmoney', name: 'WebMoney' },
      ];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw new BadRequestException('Не удалось получить методы платежа');
    }
  }

  /**
   * Обработка webhook уведомлений от YooKassa
   */
  async handleWebhook(webhookData: any) {
    try {
      // Проверяем подпись webhook (важно для безопасности)
      // const isValid = this.verifyWebhookSignature(webhookData);
      // if (!isValid) {
      //   throw new BadRequestException('Invalid webhook signature');
      // }

      const { type, object } = webhookData;

      switch (type) {
        case 'payment.succeeded':
          await this.handleSuccessfulPayment(object);
          break;
        case 'payment.canceled':
          await this.handleCanceledPayment(object);
          break;
        case 'refund.succeeded':
          await this.handleSuccessfulRefund(object);
          break;
        default:
          console.log('Unknown webhook type:', type);
      }

      return { status: 'ok' };
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new BadRequestException('Ошибка обработки webhook');
    }
  }

  /**
   * Обработка успешного платежа
   */
  private async handleSuccessfulPayment(payment: any) {
    try {
      const userId = payment.metadata?.user_id;
      if (!userId) {
        console.error('User ID not found in payment metadata');
        return;
      }

      // Завершаем транзакцию и обновляем баланс
      await this.completeTransaction(payment.id, TransactionStatus.COMPLETED);

      // Отправляем уведомление пользователю
      // await this.notificationService.sendPaymentSuccessNotification(userId, amount);

      console.log(`Payment ${payment.id} succeeded for user ${userId}, amount: ${payment.amount.value}`);
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  /**
   * Обработка отмененного платежа
   */
  private async handleCanceledPayment(payment: any) {
    try {
      const userId = payment.metadata?.user_id;
      if (!userId) {
        console.error('User ID not found in payment metadata');
        return;
      }

      // Отправляем уведомление пользователю об отмене
      // await this.notificationService.sendPaymentCanceledNotification(userId);

      console.log(`Payment ${payment.id} was canceled for user ${userId}`);
    } catch (error) {
      console.error('Error handling canceled payment:', error);
    }
  }

  /**
   * Обработка успешного возврата
   */
  private async handleSuccessfulRefund(refund: any) {
    try {
      // Логика обработки возврата
      console.log(`Refund ${refund.id} succeeded for payment ${refund.payment_id}`);
    } catch (error) {
      console.error('Error handling successful refund:', error);
    }
  }

  /**
   * Проверка подписи webhook (для безопасности)
   */
  private verifyWebhookSignature(webhookData: any): boolean {
    // Здесь должна быть реализована проверка подписи webhook
    // в соответствии с документацией YooKassa
    return true; // Упрощенная версия для демонстрации
  }



  /**
   * Создание записи транзакции в базе данных
   */
  private async createTransactionRecord(
    userId: string,
    type: TransactionType,
    amount: number,
    description: string,
    paymentId?: string,
    status: TransactionStatus = TransactionStatus.PENDING
  ): Promise<Transaction> {
    try {
      // Получаем текущий баланс пользователя
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const currentBalance = user ? parseFloat(user.balance.toString()) : 0;
      
      // Вычисляем новый баланс
      const newBalance = type === TransactionType.DEPOSIT 
        ? currentBalance + amount 
        : currentBalance - amount;

      const transaction = this.transactionRepository.create({
        userId,
        type,
        status,
        amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description,
        paymentId,
        metadata: { timestamp: new Date().toISOString() },
      });

      return await this.transactionRepository.save(transaction);
    } catch (error) {
      console.error('Error creating transaction record:', error);
      throw error;
    }
  }

  /**
   * Обновление баланса пользователя
   */
  private async updateUserBalance(userId: string, amount: number): Promise<void> {
    try {
      let user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        // Создаем пользователя если его нет (для тестирования)
        user = this.userRepository.create({
          id: userId,
          email: `test-${userId}@example.com`,
          password: 'hashed-password',
          fullName: 'Test User',
          balance: 0,
        });
        user = await this.userRepository.save(user);
      }

      const currentBalance = parseFloat(user.balance.toString());
      const newBalance = currentBalance + amount;
      
      await this.userRepository.update(userId, { balance: newBalance });
      
      console.log(`Updated balance for user ${userId}: ${currentBalance} -> ${newBalance}`);
    } catch (error) {
      console.error('Error updating user balance:', error);
    }
  }

  /**
   * Завершение транзакции (обновление статуса и баланса)
   */
  private async completeTransaction(paymentId: string, status: TransactionStatus): Promise<void> {
    try {
      const transaction = await this.transactionRepository.findOne({ 
        where: { paymentId } 
      });

      if (transaction) {
        // Обновляем статус транзакции
        await this.transactionRepository.update(transaction.id, { status });

        // Если транзакция успешна, обновляем баланс пользователя
        if (status === TransactionStatus.COMPLETED && transaction.type === TransactionType.DEPOSIT) {
          await this.updateUserBalance(transaction.userId, transaction.amount);
        }

        console.log(`Transaction ${transaction.id} completed with status: ${status}`);
      }
    } catch (error) {
      console.error('Error completing transaction:', error);
    }
  }

  /**
   * Получение транзакций пользователя
   */
  async getUserTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      return await this.transactionRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  }

  /**
   * Получение баланса пользователя
   */
  async getUserBalance(userId: string): Promise<number> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      return user ? parseFloat(user.balance.toString()) : 0;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      return 0;
    }
  }

  /**
   * Генерация ключа идемпотентности для YooKassa
   */
  private generateIdempotenceKey(): string {
    return require('crypto').randomUUID();
  }
} 