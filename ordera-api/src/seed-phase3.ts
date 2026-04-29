import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './modules/users/user.schema';
import { Branch } from './modules/branches/branch.schema';
import { Category } from './modules/menu/schemas/category.schema';
import { MenuItem } from './modules/menu/schemas/menu-item.schema';
import { BusinessDay } from './modules/scheduling/business-day.schema';
import { Thread } from './modules/messages/schemas/thread.schema';
import { Order } from './modules/ordering/schemas/order.schema';
import { Bill } from './modules/billing/schemas/bill.schema';
import { Role } from './common/enums/role.enum';
import { StockStatus } from './common/enums/stock-status.enum';
import { ShiftStatus } from './common/enums/shift-status.enum';
import { ThreadType } from './common/enums/thread-type.enum';
import { OrderStatus } from './common/enums/order-status.enum';
import { OrderType } from './common/enums/order-type.enum';
import { BillStatus } from './common/enums/bill-status.enum';
import { PaymentMethod } from './common/enums/payment-method.enum';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * PHASE 3 SEED: Detailed Staff, Menu, and Transactional Data
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const branchModel = app.get<Model<Branch>>(getModelToken(Branch.name));
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
  const menuItemModel = app.get<Model<MenuItem>>(getModelToken(MenuItem.name));
  const businessDayModel = app.get<Model<BusinessDay>>(getModelToken(BusinessDay.name));
  const threadModel = app.get<Model<Thread>>(getModelToken(Thread.name));
  const orderModel = app.get<Model<Order>>(getModelToken(Order.name));
  const billModel = app.get<Model<Bill>>(getModelToken(Bill.name));

  console.log('\n--- Phase 3 Seed: Detailed Data (Staff, Menu, Business Day, Messages) ---\n');

  const branches = await branchModel.find({});
  if (branches.length === 0) {
    console.error('❌ No branches found. Run seed-phase2.ts first.');
    process.exit(1);
  }

  const staffPassword = await bcrypt.hash('Staff@1234', 12);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Nigerian Name Pools
  const waiter1Names = [
    { first: 'Ada', last: 'Okonkwo' },
    { first: 'Zainab', last: 'Balarabe' },
    { first: 'Chinyere', last: 'Umeh' },
    { first: 'Fatima', last: 'Gadzama' },
    { first: 'Blessing', last: 'Adebayo' },
    { first: 'Amaka', last: 'Uzo' }
  ];
  const waiter2Names = [
    { first: 'Chukwuemeka', last: 'Nwosu' },
    { first: 'Abubakar', last: 'Idris' },
    { first: 'Oladapo', last: 'Balogun' },
    { first: 'Ifeanyi', last: 'Eze' },
    { first: 'Segun', last: 'Ajayi' },
    { first: 'Uche', last: 'Madu' }
  ];
  const kitchenNames = [
    { first: 'Emeka', last: 'Obi' },
    { first: 'Yakubu', last: 'Dogara' },
    { first: 'Tunde', last: 'Oloyede' },
    { first: 'Ken', last: 'Nnamani' },
    { first: 'Femi', last: 'Kuti' },
    { first: 'Sani', last: 'Abacha' }
  ];
  const cashierNames = [
    { first: 'Blessing', last: 'Eze' },
    { first: 'Rukayat', last: 'Jimoh' },
    { first: 'Titilayo', last: 'Dawodu' },
    { first: 'Damilola', last: 'Adeyemi' },
    { first: 'Nkechi', last: 'Osuji' },
    { first: 'Funke', last: 'Akindele' }
  ];

  const credentials: any[] = [];

  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const orgId = branch.organizationId;
    console.log(`Processing Branch: ${branch.name}...`);

    // 1. ADD STAFF (4 new staff per branch)
    const staffPool = [
      { ...waiter1Names[i], role: Role.WAITER, type: 'waiter1' },
      { ...waiter2Names[i], role: Role.WAITER, type: 'waiter2' },
      { ...kitchenNames[i], role: Role.KITCHEN_STAFF, type: 'kitchen' },
      { ...cashierNames[i], role: Role.CASHIER, type: 'cashier' }
    ];

    const branchStaff: any[] = [];
    for (const s of staffPool) {
      const email = `${s.first.toLowerCase()}.${s.type}@mamachidi.com`;
      const staffUser = await userModel.create({
        organizationId: orgId,
        branchId: branch._id,
        role: s.role,
        firstName: s.first,
        lastName: s.last,
        email: email,
        passwordHash: staffPassword,
        isEmailVerified: true,
      });
      branchStaff.push(staffUser);
      credentials.push({ branch: branch.name, name: `${s.first} ${s.last}`, role: s.role, email });
    }

    // Get the Manager (already seeded)
    const manager = await userModel.findOne({ branchId: branch._id, role: Role.BRANCH_MANAGER });
    if (manager) {
      branchStaff.push(manager);
    }

    // 2. MENU SEED
    const categories = [
      { name: 'Nigerian Dishes', slug: 'nigerian-dishes' },
      { name: 'Grills & Protein', slug: 'grills-protein' },
      { name: 'Drinks', slug: 'drinks' },
      { name: 'Extras', slug: 'extras' }
    ];

    for (const catData of categories) {
      const cat = await categoryModel.create({
        organizationId: orgId,
        branchId: branch._id,
        ...catData,
        isActive: true
      });

      const items = [];
      if (cat.slug === 'nigerian-dishes') {
        items.push(
          { name: 'Jollof Rice', price: 250000, stockStatus: StockStatus.AVAILABLE },
          { name: 'Fried Rice', price: 280000, stockStatus: StockStatus.AVAILABLE },
          { name: 'Egusi Soup + Pounded Yam', price: 350000, stockStatus: StockStatus.AVAILABLE },
          { name: 'Ofe Onugbu + Fufu', price: 320000, stockStatus: StockStatus.LOW },
          { name: 'Pepper Soup (Assorted)', price: 450000, stockStatus: StockStatus.AVAILABLE }
        );
      } else if (cat.slug === 'grills-protein') {
        items.push(
          { name: 'Catfish (Peppered)', price: 550000, stockStatus: StockStatus.AVAILABLE },
          { name: 'Chicken (Half)', price: 400000, stockStatus: StockStatus.AVAILABLE },
          { name: 'Goat Meat (per portion)', price: 380000, stockStatus: StockStatus.LOW },
          { name: 'Suya (per stick)', price: 80000, stockStatus: StockStatus.FINISHED }
        );
      } else if (cat.slug === 'drinks') {
        items.push(
          { name: 'Soft Drinks (Can)', price: 40000, stockStatus: StockStatus.AVAILABLE },
          { name: 'Fruit Juice (500ml)', price: 70000, stockStatus: StockStatus.AVAILABLE },
          { name: 'Water (75cl)', price: 20000, stockStatus: StockStatus.AVAILABLE },
          { name: 'Malt (Can)', price: 50000, stockStatus: StockStatus.AVAILABLE }
        );
      } else if (cat.slug === 'extras') {
        items.push(
          { name: 'Plantain (Fried)', price: 60000, stockStatus: StockStatus.AVAILABLE },
          { name: 'Coleslaw', price: 40000, stockStatus: StockStatus.AVAILABLE }
        );
      }

      for (const item of items) {
        await menuItemModel.create({
          organizationId: orgId,
          branchId: branch._id,
          categoryId: cat._id,
          name: item.name,
          price: { amount: item.price, currency: 'NGN' },
          stockStatus: item.stockStatus,
          isActive: true
        });
      }
    }

    // 3. OPEN BUSINESS DAY
    if (manager) {
      await businessDayModel.findOneAndUpdate(
        { branchId: branch._id, date: today },
        {
          organizationId: orgId,
          branchId: branch._id,
          date: today,
          status: ShiftStatus.OPEN,
          scheduledOpen: '07:00',
          scheduledClose: '22:00',
          actualOpen: new Date(),
          openedByUserId: manager._id,
        },
        { upsert: true, new: true }
      );
    }

    // 4. SYSTEM THREADS
    const threadData = [
      { name: 'Front of House', members: branchStaff.map(s => s._id) },
      { name: 'Kitchen', members: branchStaff.filter(s => [Role.KITCHEN_STAFF, Role.BRANCH_MANAGER].includes(s.role)).map(s => s._id) },
      { name: 'Management', members: branchStaff.filter(s => s.role === Role.BRANCH_MANAGER).map(s => s._id) }
    ];

    for (const t of threadData) {
      await threadModel.create({
        organizationId: orgId,
        branchId: branch._id,
        name: t.name,
        type: ThreadType.GROUP,
        isSystemThread: true,
        memberIds: t.members,
        unreadCounts: new Map()
      });
    }

    // 5. SEED ORDERS (Trans-Amadi only)
    if (branch.slug === 'trans-amadi-hq') {
      console.log('Seeding samples for Trans-Amadi branch...');
      const waiter = branchStaff.find(s => s.role === Role.WAITER);
      const items = await menuItemModel.find({ branchId: branch._id });

      const createOrder = async (table: string, guests: number, status: OrderStatus, orderItems: any[]) => {
        const orderData: any = {
          organizationId: orgId,
          branchId: branch._id,
          waiterId: waiter._id,
          waiterName: waiter.firstName,
          tableNumber: table,
          guestCount: guests,
          status: status,
          orderType: OrderType.DINE_IN,
          items: orderItems,
        };

        // Calculate totals
        const subtotal = orderItems.reduce((acc, item) => acc + (item.unitPrice.amount * item.quantity), 0);
        orderData.subtotal = { amount: subtotal, currency: 'NGN' };
        orderData.tax = { amount: Math.round(subtotal * 0.075), currency: 'NGN' };
        orderData.total = { amount: orderData.subtotal.amount + orderData.tax.amount, currency: 'NGN' };

        return orderModel.create(orderData);
      }

      // Order 1: SERVED
      const itemJollof = items.find(i => i.name === 'Jollof Rice');
      const itemSoft = items.find(i => i.name === 'Soft Drinks (Can)');
      await createOrder('3', 2, OrderStatus.SERVED, [
        { menuItemId: itemJollof._id, name: 'Jollof Rice', unitPrice: itemJollof.price, quantity: 2, lineTotal: { amount: itemJollof.price.amount * 2, currency: 'NGN' } },
        { menuItemId: itemSoft._id, name: 'Soft Drinks (Can)', unitPrice: itemSoft.price, quantity: 2, lineTotal: { amount: itemSoft.price.amount * 2, currency: 'NGN' } }
      ]);

      // Order 2: IN_PREPARATION
      const itemEgusi = items.find(i => i.name === 'Egusi Soup + Pounded Yam');
      const itemJuice = items.find(i => i.name === 'Fruit Juice (500ml)');
      await createOrder('7', 4, OrderStatus.IN_PREPARATION, [
        { menuItemId: itemEgusi._id, name: 'Egusi Soup + Pounded Yam', unitPrice: itemEgusi.price, quantity: 4, lineTotal: { amount: itemEgusi.price.amount * 4, currency: 'NGN' } },
        { menuItemId: itemJuice._id, name: 'Fruit Juice (500ml)', unitPrice: itemJuice.price, quantity: 4, lineTotal: { amount: itemJuice.price.amount * 4, currency: 'NGN' } }
      ]);

      // Order 3: SENT_TO_KITCHEN
      const itemCatfish = items.find(i => i.name === 'Catfish (Peppered)');
      const itemWater = items.find(i => i.name === 'Water (75cl)');
      await createOrder('1', 1, OrderStatus.SENT_TO_KITCHEN, [
        { menuItemId: itemCatfish._id, name: 'Catfish (Peppered)', unitPrice: itemCatfish.price, quantity: 1, lineTotal: itemCatfish.price },
        { menuItemId: itemWater._id, name: 'Water (75cl)', unitPrice: itemWater.price, quantity: 1, lineTotal: itemWater.price }
      ]);

      // Order 4: BILLED (PAID)
      const itemFried = items.find(i => i.name === 'Fried Rice');
      const itemChicken = items.find(i => i.name === 'Chicken (Half)');
      const order4 = await createOrder('5', 3, OrderStatus.BILLED, [
        { menuItemId: itemFried._id, name: 'Fried Rice', unitPrice: itemFried.price, quantity: 3, lineTotal: { amount: itemFried.price.amount * 3, currency: 'NGN' } },
        { menuItemId: itemChicken._id, name: 'Chicken (Half)', unitPrice: itemChicken.price, quantity: 3, lineTotal: { amount: itemChicken.price.amount * 3, currency: 'NGN' } }
      ]);

      // Create Pill for Order 4
      await billModel.create({
        organizationId: orgId,
        branchId: branch._id,
        orderId: order4._id,
        waiterId: waiter._id,
        waiterName: waiter.firstName,
        tableNumber: '5',
        items: order4.items,
        subtotal: order4.subtotal,
        tax: order4.tax,
        total: order4.total,
        status: BillStatus.PAID,
        paidAt: new Date(),
        payment: {
          method: PaymentMethod.CASH,
          amountPaid: order4.total,
          change: { amount: 0, currency: 'NGN' },
          processedAt: new Date(),
        }
      });

      // Order 5: PENDING
      await createOrder('9', 2, OrderStatus.PENDING, [
        { menuItemId: itemJollof._id, name: 'Jollof Rice', unitPrice: itemJollof.price, quantity: 1, lineTotal: itemJollof.price }
      ]);
    }
  }

  // Final Output
  console.log('\n✅ Phase 3 Seed Complete\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('👤 STAFF CREDENTIALS (password: Staff@1234):');
  
  const groupedCredits = credentials.reduce((acc, curr) => {
    if (!acc[curr.branch]) acc[curr.branch] = [];
    acc[curr.branch].push(curr);
    return acc;
  }, {});

  for (const bName in groupedCredits) {
    console.log(`\n📍 Branch: ${bName}`);
    groupedCredits[bName].forEach(c => {
      console.log(`  ${c.role.padEnd(15)} | ${c.name.padEnd(25)} | ${c.email}`);
    });
  }
  console.log('\n═══════════════════════════════════════════════════════════════\n');

  await app.close();
  process.exit(0);
}

bootstrap();
