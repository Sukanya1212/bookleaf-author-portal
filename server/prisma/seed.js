import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BookLeaf database seed...');

  // Clean existing records in correct relation order
  await prisma.internalNote.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const authorPasswordHash = await bcrypt.hash('Author@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Create Default Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bookleafpub.com',
      passwordHash: adminPasswordHash,
      name: 'BookLeaf Ops Admin',
      phone: '+91-99999-00000',
      city: 'Delhi',
      role: 'ADMIN',
      joinedDate: '2022-01-01'
    }
  });
  console.log(`✅ Admin account created: ${adminUser.email} / Admin@123`);

  // 2. Load Sample Data JSON
  const sampleDataPath = path.resolve(__dirname, '../../bookleaf_sample_data.json');
  if (!fs.existsSync(sampleDataPath)) {
    throw new Error(`Sample data file not found at: ${sampleDataPath}`);
  }

  const rawData = fs.readFileSync(sampleDataPath, 'utf-8');
  const { authors } = JSON.parse(rawData);

  console.log(`📚 Seeding ${authors.length} authors and their books...`);

  const createdAuthors = [];
  const createdBooks = [];

  for (const authorData of authors) {
    const author = await prisma.user.create({
      data: {
        authorId: authorData.author_id,
        email: authorData.email,
        passwordHash: authorPasswordHash,
        name: authorData.name,
        phone: authorData.phone,
        city: authorData.city,
        role: 'AUTHOR',
        joinedDate: authorData.joined_date
      }
    });
    createdAuthors.push(author);

    for (const bookData of authorData.books) {
      const book = await prisma.book.create({
        data: {
          bookId: bookData.book_id,
          authorId: author.id,
          title: bookData.title,
          isbn: bookData.isbn,
          genre: bookData.genre,
          publicationDate: bookData.publication_date,
          status: bookData.status,
          mrp: bookData.mrp ? parseFloat(bookData.mrp) : null,
          authorRoyaltyPerCopy: bookData.author_royalty_per_copy ? parseFloat(bookData.author_royalty_per_copy) : null,
          totalCopiesSold: bookData.total_copies_sold || 0,
          totalRoyaltyEarned: bookData.total_royalty_earned ? parseFloat(bookData.total_royalty_earned) : 0,
          royaltyPaid: bookData.royalty_paid ? parseFloat(bookData.royalty_paid) : 0,
          royaltyPending: bookData.royalty_pending ? parseFloat(bookData.royalty_pending) : 0,
          lastRoyaltyPayoutDate: bookData.last_royalty_payout_date,
          printPartner: bookData.print_partner,
          availableOn: JSON.stringify(bookData.available_on || [])
        }
      });
      createdBooks.push(book);
    }
  }

  console.log(`✅ Seeded ${createdAuthors.length} authors and ${createdBooks.length} books.`);

  // 3. Seed Realistic Sample Tickets representing edge cases from assignment
  console.log('🎫 Seeding initial sample tickets with AI drafts...');

  const priya = createdAuthors.find(a => a.email === 'priya.sharma@email.com');
  const priyaBook = createdBooks.find(b => b.bookId === 'BK001');

  const rohit = createdAuthors.find(a => a.email === 'rohit.kapoor@email.com');
  const rohitBook = createdBooks.find(b => b.bookId === 'BK004');

  const sneha = createdAuthors.find(a => a.email === 'sneha.kulkarni@email.com');
  const snehaBook = createdBooks.find(b => b.bookId === 'BK013'); // In Production

  // Ticket 1: Urgent Royalty Query for Rohit Kapoor
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-1001',
      authorId: rohit.id,
      bookId: rohitBook.id,
      subject: 'I haven’t received my pending royalties for Startup Sutra',
      description: 'I published Startup Sutra and have ₹7,744 in pending royalties according to my dashboard. The last payout was November 15, and I have not received updates for the subsequent quarter.',
      status: 'Open',
      category: 'Royalty & Payments',
      priority: 'High',
      aiReasoning: 'Author has significant pending royalties (₹7,744) above the ₹1,000 threshold and is inquiring about an overdue quarterly payment cycle.',
      aiDraftResponse: `Dear Rohit,\n\nThank you for reaching out to BookLeaf author support regarding your book "Startup Sutra". We understand your concern regarding the pending royalty of ₹7,744.\n\nAs per BookLeaf's royalty policy, royalties are calculated on a quarterly basis and disbursed within 45 days of the quarter ending via direct bank transfer. Your pending amount of ₹7,744 exceeds our ₹1,000 minimum threshold and is currently queued for the upcoming quarterly payout.\n\nCould you please confirm if your bank account details in your dashboard profile remain updated? In the meantime, I have escalated your payout record to our finance team for verification. We will follow up with an update within 48 hours.\n\nWarm regards,\nBookLeaf Author Support Team`,
      assignedToAdminId: adminUser.id
    }
  });

  await prisma.internalNote.create({
    data: {
      ticketId: ticket1.id,
      adminId: adminUser.id,
      note: 'Finance batch for Q4 payouts is currently processing. Rohit bank details look verified.'
    }
  });

  // Ticket 2: Production Stage inquiry for Sneha Kulkarni (Book in production)
  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-1002',
      authorId: sneha.id,
      bookId: snehaBook.id,
      subject: 'Update on Midnight in Mysore cover design timeline',
      description: 'It has been almost 3 weeks since I submitted the revised cover preferences. When can I expect the final cover proof for Midnight in Mysore?',
      status: 'In Progress',
      category: 'Book Status & Production Updates',
      priority: 'Medium',
      aiReasoning: 'Author is asking about production stage turnaround time for cover design. Turnaround is within standard window but approaching delay threshold.',
      aiDraftResponse: `Dear Sneha,\n\nThank you for following up on "Midnight in Mysore". We appreciate your patience while our design team works on your cover concepts.\n\nYour title is currently in the Cover Design stage. Delays at this stage typically happen during custom revision rounds to ensure the artwork matches your exact vision. Our senior design team is finalizing two updated proof options and will send them to your email for approval within 2 business days.\n\nOnce you approve the cover proof, we will immediately move your manuscript into Typesetting.\n\nWarm regards,\nBookLeaf Author Support Team`
    }
  });

  // Ticket 3: Resolved query for Priya Sharma
  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-1003',
      authorId: priya.id,
      bookId: priyaBook.id,
      subject: 'Can I update the book description on Amazon India?',
      description: 'I would like to update the synopsis of Whispers of the Ganges on Amazon India with recent endorsements.',
      status: 'Resolved',
      category: 'General Inquiry',
      priority: 'Low',
      aiReasoning: 'Standard metadata update request on live published book.',
      aiDraftResponse: `Dear Priya,\n\nYes, you can certainly update your book synopsis on Amazon India. Changes typically reflect on retail platforms within 3–5 business days once submitted. Please send the new blurb here, and our distribution team will update the metadata.`,
      assignedToAdminId: adminUser.id
    }
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket3.id,
      senderId: adminUser.id,
      message: `Dear Priya,\n\nYes, you can certainly update your book description! Please reply with the revised synopsis, and our metadata team will push the update to Amazon India and Flipkart. Changes usually take 3–5 business days to reflect.\n\nBest regards,\nBookLeaf Operations`
    }
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
