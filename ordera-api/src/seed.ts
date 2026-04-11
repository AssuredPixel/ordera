import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Role } from './common/enums/role.enum';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined in .env');
  process.exit(1);
}

// ─── Mongoose Schemas (lightweight for seeding) ───────────────────────────────

const OrgSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  country: String,
  currency: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const BranchSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: String,
  slug: { type: String },
  address: { street: String, city: String, state: String, country: String, postalCode: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  salesId: String,
  passwordHash: String,
  role: String,
  firstName: String,
  lastName: String,
  email: String,
  isActive: { type: Boolean, default: true },
  activeSessions: { type: Array, default: [] }
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
}, { timestamps: true });

const MoneySchema = new mongoose.Schema({ amount: Number, currency: String }, { _id: false });
const AddonSchema = new mongoose.Schema({ name: String, price: MoneySchema, imageUrl: String });

const CategorySchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  name: String,
  slug: String,
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const MenuItemSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  name: String,
  description: String,
  price: MoneySchema,
  weight: String,
  imageUrl: String,
  addons: [AddonSchema],
  inStock: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ThreadSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  type: { type: String, enum: ['group', 'direct'] },
  name: String,
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: {
    content: String,
    senderName: String,
    sentAt: { type: Date, default: Date.now }
  },
  unreadCounts: { type: Map, of: Number, default: {} }
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: String,
  senderAvatar: String,
  content: String,
  attachmentUrl: String,
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: { createdAt: true, updatedAt: false } });

const OrderSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  orderType: { type: String, enum: ['dine_in', 'takeaway', 'delivery'] },
  status: String,
  total: MoneySchema,
  items: [{ name: String, quantity: Number, lineTotal: MoneySchema }]
}, { timestamps: true });

const BillSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  total: MoneySchema,
  status: String,
  paidAt: Date
}, { timestamps: true });

// ─── Menu seed data ───────────────────────────────────────────────────────────

const menuCatalog = [
  {
    category: { name: 'Burgers', slug: 'burgers', displayOrder: 0 },
    items: [
      { name: 'Classic Beef Burger', description: 'Juicy beef patty with lettuce, tomato & cheese', price: 350000, weight: '200g' },
      { name: 'Chicken Burger', description: 'Crispy fried chicken fillet with coleslaw', price: 300000, weight: '180g' },
      { name: 'Double Smash Burger', description: 'Two smashed beef patties with special sauce', price: 480000, weight: '320g' },
      { name: 'BBQ Bacon Burger', description: 'Beef patty, crispy bacon, BBQ sauce', price: 420000, weight: '230g' },
      { name: 'Veggie Bean Burger', description: 'Spiced black bean patty with avocado', price: 280000, weight: '160g' },
      { name: 'Tower Burger', description: 'Triple patty stacked high with jalapeños', price: 560000, weight: '450g' },
    ],
  },
  {
    category: { name: 'Seafood', slug: 'seafood', displayOrder: 1 },
    items: [
      { name: 'Grilled Salmon', description: 'Atlantic salmon fillet with lemon herb butter', price: 650000, weight: '250g' },
      { name: 'Prawn Skewers', description: 'Marinated king prawns grilled to perfection', price: 580000, weight: '200g' },
      { name: 'Fish & Chips', description: 'Beer-battered tilapia with seasoned golden fries', price: 420000, weight: '300g' },
      { name: 'Seafood Platter', description: 'Prawns, calamari, fish fillet & dipping sauces', price: 950000, weight: '500g' },
      { name: 'Calamari Rings', description: 'Crispy fried calamari with tartar sauce', price: 380000, weight: '180g' },
      { name: 'Pepper Crab', description: 'Whole crab in rich Lagos pepper sauce', price: 1200000, weight: '600g' },
    ],
  },
  {
    category: { name: 'Sushi', slug: 'sushi', displayOrder: 2 },
    items: [
      { name: 'Salmon Nigiri (2pcs)', description: 'Fresh salmon slices over seasoned rice', price: 280000, weight: '80g' },
      { name: 'Spicy Tuna Roll (8pcs)', description: 'Tuna, cucumber, spicy mayo, sesame', price: 450000, weight: '180g' },
      { name: 'Dragon Roll (8pcs)', description: 'Prawn tempura, avocado, unagi sauce', price: 520000, weight: '200g' },
      { name: 'Rainbow Roll (8pcs)', description: 'California roll topped with sashimi assortment', price: 580000, weight: '220g' },
      { name: 'Vegetable Maki (6pcs)', description: 'Cucumber, avocado, pickled radish', price: 220000, weight: '120g' },
      { name: 'Sashimi Platter', description: '12 pieces of chef\'s selection fresh sashimi', price: 780000, weight: '240g' },
    ],
  },
  {
    category: { name: 'Cold Drinks', slug: 'cold-drinks', displayOrder: 3 },
    items: [
      { name: 'Fresh Zobo', description: 'Chilled hibiscus & ginger blend', price: 120000, weight: '500ml' },
      { name: 'Chapman', description: 'Classic Nigerian fruit punch with grenadine', price: 150000, weight: '500ml' },
      { name: 'Fresh Lemonade', description: 'Hand-squeezed lemon, mint & sugar syrup', price: 130000, weight: '400ml' },
      { name: 'Watermelon Juice', description: 'Blended fresh watermelon, no sugar added', price: 140000, weight: '400ml' },
      { name: 'Ginger Beer (Can)', description: 'Premium non-alcoholic spiced ginger beer', price: 80000, weight: '330ml' },
      { name: 'Mango Smoothie', description: 'Ripe mango, yoghurt & honey blend', price: 180000, weight: '400ml' },
    ],
  },
  {
    category: { name: 'Pizza', slug: 'pizza', displayOrder: 4 },
    items: [
      { name: 'Margherita', description: 'San Marzano tomato, fresh mozzarella, basil', price: 380000, weight: '350g' },
      { name: 'Pepperoni', description: 'Loaded pepperoni slices, mozzarella, oregano', price: 450000, weight: '400g' },
      { name: 'BBQ Chicken', description: 'Smoky BBQ sauce, grilled chicken, red onion', price: 480000, weight: '420g' },
      { name: 'Four Cheese', description: 'Mozzarella, gouda, parmesan, ricotta', price: 500000, weight: '400g' },
      { name: 'Suya Pizza', description: 'Suya-spiced beef, peppers, tomato base', price: 520000, weight: '430g' },
      { name: 'Veggie Deluxe', description: 'Mushroom, peppers, olives, artichoke, spinach', price: 420000, weight: '390g' },
    ],
  },
  {
    category: { name: 'Milkshakes', slug: 'milkshakes', displayOrder: 5 },
    items: [
      { name: 'Classic Vanilla', description: 'Creamy Madagascar vanilla bean shake', price: 200000, weight: '400ml' },
      { name: 'Rich Chocolate', description: 'Dark cocoa, whole milk, chocolate drizzle', price: 220000, weight: '400ml' },
      { name: 'Fresh Strawberry', description: 'Real strawberries blended with ice cream', price: 230000, weight: '400ml' },
      { name: 'Oreo Cookie Shake', description: 'Crushed Oreos, vanilla cream, milk', price: 250000, weight: '450ml' },
      { name: 'Salted Caramel', description: 'Caramel syrup, sea salt, whipped cream', price: 250000, weight: '400ml' },
      { name: 'Peanut Butter Blast', description: 'Natural PB, banana, honey, whole milk', price: 260000, weight: '400ml' },
    ],
  },
];

// ─── Seed Function ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('--- Ordera Multi-Tenancy Seeder ---');
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected to MongoDB.');

  const OrganizationModel = mongoose.model('Organization', OrgSchema);
  const BranchModel = mongoose.model('Branch', BranchSchema);
  const UserModel = mongoose.model('User', UserSchema);
  const CategoryModel = mongoose.model('Category', CategorySchema);
  const MenuItemModel = mongoose.model('MenuItem', MenuItemSchema);
  const ThreadModel = mongoose.model('Thread', ThreadSchema);
  const MessageModel = mongoose.model('Message', MessageSchema);
  const CustomerModel = mongoose.model('Customer', CustomerSchema);
  const OrderModel = mongoose.model('Order', OrderSchema);
  const BillModel = mongoose.model('Bill', BillSchema);

  const orgConfigs = [
    { name: 'Demo Restaurant', slug: 'demo', country: 'NG', currency: 'NGN' },
    { name: 'Lagos Lounge', slug: 'lagos', country: 'NG', currency: 'NGN' },
    { name: 'Pizza Place', slug: 'pizza', country: 'US', currency: 'USD' },
  ];

  const passwordHash = await bcrypt.hash('password123', 12);

  for (const config of orgConfigs) {
    console.log(`\nProcessing Organization: ${config.name}...`);

    const org = await OrganizationModel.findOneAndUpdate(
      { slug: config.slug },
      { $set: config },
      { upsert: true, new: true }
    );

    const branch = await BranchModel.findOneAndUpdate(
      { organizationId: org._id, slug: 'main' },
      { $set: { name: 'Main Branch', slug: 'main', address: { street: '123 Street', city: 'City', country: config.country } } },
      { upsert: true, new: true }
    );

    const rolesData = [
      { role: Role.OWNER, prefix: 'OWNER' },
      { role: Role.MANAGER, prefix: 'MGR' },
      { role: Role.SUPERVISOR, prefix: 'SUP' },
      { role: Role.WAITER, prefix: 'WAIT' },
      { role: Role.KITCHEN, prefix: 'KITC' },
    ];

    const users = [];
    for (const roleInfo of rolesData) {
      const salesId = `${roleInfo.prefix}001`;
      const u = await UserModel.findOneAndUpdate(
        { organizationId: org._id, salesId },
        {
          $set: {
            organizationId: org._id,
            branchId: branch._id,
            salesId,
            passwordHash,
            role: roleInfo.role,
            firstName: roleInfo.prefix.charAt(0) + roleInfo.prefix.slice(1).toLowerCase(),
            lastName: config.name.split(' ')[0],
            email: `${salesId.toLowerCase()}@${config.slug}.com`,
            isActive: true
          }
        },
        { upsert: true, new: true }
      );
      users.push(u);
    }
    console.log(`  ✓ Users seeded (5 roles)`);

    // Only seed messaging for Demo Restaurant
    if (config.slug === 'demo') {
      const owner = users.find(u => u.role === Role.OWNER);
      const manager = users.find(u => u.role === Role.MANAGER);
      const supervisor = users.find(u => u.role === Role.SUPERVISOR);
      const waiter = users.find(u => u.role === Role.WAITER);
      const kitchen = users.find(u => u.role === Role.KITCHEN);

      const threadConfigs = [
        { name: 'Front of House', type: 'group', members: [owner, manager, supervisor, waiter, kitchen].map(u => u._id) },
        { name: 'Kitchen', type: 'group', members: [manager, supervisor, kitchen].map(u => u._id) },
        { name: 'Management', type: 'group', members: [owner, manager].map(u => u._id) },
        { name: null, type: 'direct', members: [owner._id, manager._id] },
        { name: null, type: 'direct', members: [manager._id, supervisor._id] },
      ];

      for (const tConfig of threadConfigs) {
        const thread = await ThreadModel.findOneAndUpdate(
          { organizationId: org._id, branchId: branch._id, name: tConfig.name, type: tConfig.type, memberIds: { $all: tConfig.members, $size: tConfig.members.length } },
          {
            $set: {
              organizationId: org._id,
              branchId: branch._id,
              type: tConfig.type,
              name: tConfig.name,
              memberIds: tConfig.members,
              unreadCounts: tConfig.members.reduce((acc, id) => ({ ...acc, [id.toString()]: 0 }), {})
            }
          },
          { upsert: true, new: true }
        );

        // Add 5 messages
        const messages = [
          "Hey team, let's have a great shift today!",
          "Don't forget the table 5 special request.",
          "We are running low on Salmon, update the inventory.",
          "Waiters, please double check the bill amounts.",
          "Shift report submitted. Great work everyone!"
        ];

        for (let i = 0; i < messages.length; i++) {
          const sender = users[i % users.length];
          await MessageModel.create({
            organizationId: org._id,
            threadId: thread._id,
            senderId: sender._id,
            senderName: `${sender.firstName} ${sender.lastName}`,
            content: messages[i],
            readBy: [sender._id],
            createdAt: new Date(Date.now() - (5 - i) * 60000)
          });
        }
        
        // Update last message
        const lastMsg = messages[messages.length - 1];
        const lastSender = users[(messages.length - 1) % users.length];
        await ThreadModel.findByIdAndUpdate(thread._id, {
          $set: {
            lastMessage: {
              content: lastMsg,
              senderName: lastSender.firstName,
              sentAt: new Date()
            }
          }
        });
      }
      console.log(`  ✓ Messaging threads + history seeded`);
    }

    // 4. Upsert Categories + Menu Items
    for (const catalog of menuCatalog) {
      const cat = await CategoryModel.findOneAndUpdate(
        { organizationId: org._id, branchId: branch._id, slug: catalog.category.slug },
        {
          $set: {
            ...catalog.category,
            organizationId: org._id,
            branchId: branch._id,
            isActive: true,
          }
        },
        { upsert: true, new: true }
      );

      for (const item of catalog.items) {
        await MenuItemModel.findOneAndUpdate(
          { organizationId: org._id, branchId: branch._id, categoryId: cat._id, name: item.name },
          {
            $set: {
              organizationId: org._id,
              branchId: branch._id,
              categoryId: cat._id,
              name: item.name,
              description: item.description,
              price: { amount: item.price, currency: config.currency },
              weight: item.weight,
              inStock: true,
              isActive: true,
            }
          },
          { upsert: true }
        );
      }
      console.log(`  ✓ Category "${catalog.category.name}" — ${catalog.items.length} items`);
    }

    // 5. Seed Transactional Data for Dashboard (Demo Org Only)
    if (config.slug === 'demo') {
      console.log(`\n  Seeding Transactional Data (Orders/Bills)...`);
      const menuItems = await MenuItemModel.find({ organizationId: org._id });
      const waiter = users.find(u => u.role === Role.WAITER) || users[0];

      // Create 5 Customers
      const customers = [];
      const customerData = [
        { firstName: 'Alice', lastName: 'Johnson', phone: '08012345678', email: 'alice@example.com' },
        { firstName: 'Bob', lastName: 'Smith', phone: '08087654321', email: 'bob@example.com' },
        { firstName: 'Charlie', lastName: 'Brown', phone: '08055555555', email: 'charlie@example.com' },
        { firstName: 'Diana', lastName: 'Prince', phone: '08011111111' },
        { firstName: 'Ethan', lastName: 'Hunt', phone: '08099999999' }
      ];

      for (const c of customerData) {
        const cust = await CustomerModel.findOneAndUpdate(
          { organizationId: org._id, phone: c.phone },
          { $set: { ...c, branchId: branch._id } },
          { upsert: true, new: true }
        );
        customers.push(cust);
      }
      console.log(`  ✓ ${customers.length} customers seeded`);

      // Create 20 Orders/Bills distributed across today and yesterday
      const now = new Date();
      for (let i = 0; i < 20; i++) {
        const isYesterday = i < 8; // First 8 are from yesterday
        const date = new Date();
        if (isYesterday) date.setUTCDate(date.getUTCDate() - 1);
        date.setUTCHours(9 + (i % 12), Math.floor(Math.random() * 60)); // Spread across 9AM to 9PM

        const orderType = ['dine_in', 'takeaway', 'delivery'][i % 3];
        const customer = customers[i % customers.length];
        const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
        
        const totalAmount = randomItem.price.amount * 2;
        
        const order = await OrderModel.create({
          organizationId: org._id,
          branchId: branch._id,
          staffId: waiter._id,
          customerId: customer._id,
          orderType,
          status: 'completed',
          total: { amount: totalAmount, currency: config.currency },
          items: [{ name: randomItem.name, quantity: 2, lineTotal: { amount: totalAmount, currency: config.currency } }],
          createdAt: date
        });

        await BillModel.create({
          organizationId: org._id,
          branchId: branch._id,
          orderId: order._id,
          staffId: waiter._id,
          customerId: customer._id,
          total: { amount: totalAmount, currency: config.currency },
          status: 'paid',
          paidAt: date,
          createdAt: date
        });
      }
      console.log(`  ✓ 20 Orders/Bills seeded across 48h`);
    }
  }

  console.log('\n✅ Seeding completed successfully.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
