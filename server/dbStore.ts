import { UserProfile, SkillListing, SwapContract, EscrowRecord, PaymentOrder, TimeCreditTransaction } from '../src/types';

// In-Memory Reactive Ledger & Data Store
class DatabaseStore {
  public users: Map<string, UserProfile> = new Map();
  public listings: Map<string, SkillListing> = new Map();
  public swapContracts: Map<string, SwapContract> = new Map();
  public escrowRecords: Map<string, EscrowRecord> = new Map();
  public paymentOrders: Map<string, PaymentOrder> = new Map();
  public transactions: TimeCreditTransaction[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed Demo Users
    const user1: UserProfile = {
      id: 'user_alex',
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Full-Stack & React / Next.js Architect',
      bio: 'Senior engineer passionate about teaching clean code, TypeScript, and modern front-end state architecture. Learning Spanish and Jazz piano!',
      rating: 4.95,
      reviewCount: 42,
      timeCredits: 12.5,
      escrowLockedCredits: 2.0,
      skillsOffered: ['React & Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js / Express'],
      skillsWanted: ['Conversational Spanish', 'Jazz Piano Chords', 'UI/UX Design Systems'],
      badges: ['Top Mentor', 'Fast Responder', 'P2P Pioneer', '100+ Hours Taught'],
      email: 'alex.chen@skillswap.dev',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA (PST)',
      completedSwaps: 28,
    };

    const user2: UserProfile = {
      id: 'user_elena',
      name: 'Elena Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      title: 'Native Spanish Speaker & Language Coach',
      bio: 'Certified language instructor with 8+ years coaching professionals in immersive conversational Spanish and business fluency.',
      rating: 4.98,
      reviewCount: 56,
      timeCredits: 18.0,
      escrowLockedCredits: 0.0,
      skillsOffered: ['Conversational Spanish', 'DELE Exam Prep', 'Latin American Literature'],
      skillsWanted: ['Python for Data Science', 'Figma UI Design', 'SEO Fundamentals'],
      badges: ['Master Coach', 'Super Swapper', 'Spanish Guild Lead'],
      email: 'elena.rodriguez@skillswap.dev',
      phone: '+34 612 345 678',
      location: 'Madrid, Spain (CET)',
      completedSwaps: 51,
    };

    const user3: UserProfile = {
      id: 'user_tariq',
      name: 'Tariq Al-Mansoor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'AI Researcher & PyTorch Deep Learning Specialist',
      bio: 'PhD candidate specializing in LLM fine-tuning, RAG pipelines, and diffusion models. Want to learn Italian cooking and acoustic guitar.',
      rating: 4.92,
      reviewCount: 19,
      timeCredits: 8.0,
      escrowLockedCredits: 1.5,
      skillsOffered: ['LLM Fine-tuning', 'PyTorch / TensorFlow', 'Vector Embeddings & RAG'],
      skillsWanted: ['Italian Artisan Pasta', 'Fingerstyle Guitar', 'Portrait Photography'],
      badges: ['AI Specialist', 'Verified Researcher'],
      email: 'tariq.mansoor@skillswap.dev',
      phone: '+971 50 123 4567',
      location: 'Dubai, UAE (GST)',
      completedSwaps: 14,
    };

    const user4: UserProfile = {
      id: 'user_sophia',
      name: 'Sophia Kim',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      title: 'Senior Product Designer & Design Systems Lead',
      bio: 'Designing user experiences at scale. I love mentoring budding designers in Figma auto-layout, token management, and micro-interactions.',
      rating: 5.0,
      reviewCount: 31,
      timeCredits: 22.0,
      escrowLockedCredits: 0.0,
      skillsOffered: ['Figma Design Systems', 'UX Research', 'Mobile App Prototyping'],
      skillsWanted: ['TypeScript', 'Three.js 3D Web', 'Japanese Basics'],
      badges: ['Design Master', 'Top Rated 2026'],
      email: 'sophia.kim@skillswap.dev',
      phone: '+1 (555) 987-6543',
      location: 'Seattle, WA (PST)',
      completedSwaps: 35,
    };

    const user5: UserProfile = {
      id: 'user_juma',
      name: 'Juma Mwangi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Fintech Engineer & M-Pesa Integration Lead',
      bio: 'Nairobi-based software engineer specializing in mobile money, Daraja API, microservices, and high-throughput transaction ledgers.',
      rating: 4.96,
      reviewCount: 38,
      timeCredits: 15.0,
      escrowLockedCredits: 0.0,
      skillsOffered: ['M-Pesa Daraja Integration', 'Golang Microservices', 'Kafka Event Streaming'],
      skillsWanted: ['Solidity Smart Contracts', 'Docker & Kubernetes', 'Public Speaking'],
      badges: ['Fintech Guru', 'East Africa Ambassador'],
      email: 'juma.mwangi@skillswap.dev',
      phone: '+254 712 345678',
      location: 'Nairobi, Kenya (EAT)',
      completedSwaps: 44,
    };

    [user1, user2, user3, user4, user5].forEach(u => this.users.set(u.id, u));

    // Seed Skill Listings
    const listings: SkillListing[] = [
      {
        id: 'list_1',
        userId: 'user_alex',
        user: {
          name: user1.name,
          avatar: user1.avatar,
          rating: user1.rating,
          completedSwaps: user1.completedSwaps,
          location: user1.location,
        },
        type: 'offer',
        title: 'Master Modern React 19, Server Components & TypeScript',
        category: 'Coding & Tech',
        description: 'One-on-one deep dive into modern React paradigms, clean state management with Zustand, custom hooks, and lightning-fast TypeScript workflows.',
        skillsExchanged: ['Spanish Conversation', 'Jazz Piano', 'UI Design'],
        hourlyRateCredits: 1,
        experienceLevel: 'Expert',
        tags: ['React', 'TypeScript', 'Next.js', 'Frontend Architecture'],
        syllabus: [
          'Component architecture & render cycles',
          'TypeScript generics & type-safe hooks',
          'Server vs Client components',
          'Production debugging & memory leak hunting',
        ],
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        isActive: true,
      },
      {
        id: 'list_2',
        userId: 'user_elena',
        user: {
          name: user2.name,
          avatar: user2.avatar,
          rating: user2.rating,
          completedSwaps: user2.completedSwaps,
          location: user2.location,
        },
        type: 'offer',
        title: 'Conversational Spanish & Business Fluency Bootcamp',
        category: 'Languages',
        description: 'Tailored 1-on-1 immersive conversational practice. Break the fear barrier, master verb conjugations naturally, and sound like a native.',
        skillsExchanged: ['Python for Data', 'Figma Design', 'Web Development'],
        hourlyRateCredits: 1,
        experienceLevel: 'Expert',
        tags: ['Spanish', 'Language Exchange', 'Conversational', 'Grammar'],
        syllabus: [
          'Pronunciation and accent softening',
          'Idiomatic expressions & slang in Spain/LatAm',
          'Role-playing real conversations & business pitches',
          'Custom vocabulary decks and corrections',
        ],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        isActive: true,
      },
      {
        id: 'list_3',
        userId: 'user_tariq',
        user: {
          name: user3.name,
          avatar: user3.avatar,
          rating: user3.rating,
          completedSwaps: user3.completedSwaps,
          location: user3.location,
        },
        type: 'offer',
        title: 'Build Production RAG & Fine-Tune LLMs with PyTorch',
        category: 'AI & Data Science',
        description: 'Hands-on session building retrieval-augmented generation pipelines, vector databases (Chroma/Pinecone), and QLoRA fine-tuning for custom open models.',
        skillsExchanged: ['Italian Cooking', 'Guitar Lessons', 'Design'],
        hourlyRateCredits: 1.5,
        experienceLevel: 'Advanced',
        tags: ['AI', 'PyTorch', 'LLM', 'RAG', 'Python'],
        syllabus: [
          'Vector embeddings & chunking strategies',
          'Hybrid search & re-ranking mechanisms',
          'Fine-tuning with Hugging Face & PEFT/LoRA',
          'Evaluation & hallucination mitigation',
        ],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        isActive: true,
      },
      {
        id: 'list_4',
        userId: 'user_sophia',
        user: {
          name: user4.name,
          avatar: user4.avatar,
          rating: user4.rating,
          completedSwaps: user4.completedSwaps,
          location: user4.location,
        },
        type: 'offer',
        title: 'Figma Design Systems: Tokens, Auto-Layout & Variants',
        category: 'Design & Creative',
        description: 'Level up your design skills. Learn how Silicon Valley tech leaders structure design tokens, fluid auto-layout components, and interactive prototypes.',
        skillsExchanged: ['TypeScript', 'Three.js', 'Coding'],
        hourlyRateCredits: 1,
        experienceLevel: 'Expert',
        tags: ['Figma', 'UI/UX', 'Design Tokens', 'Design Systems'],
        syllabus: [
          'Design token hierarchy (Global, Semantic, Component)',
          'Complex auto-layout & responsive constraints',
          'Component property variants & state matrix',
          'Developer handoff & documentation',
        ],
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        isActive: true,
      },
      {
        id: 'list_5',
        userId: 'user_juma',
        user: {
          name: user5.name,
          avatar: user5.avatar,
          rating: user5.rating,
          completedSwaps: user5.completedSwaps,
          location: user5.location,
        },
        type: 'offer',
        title: 'M-Pesa Daraja 3.0 & African Fintech Architecture',
        category: 'Coding & Tech',
        description: 'Master mobile money integrations: STK Push, C2B, B2C, reversal webhooks, security credential hashing, and fault-tolerant financial ledgers.',
        skillsExchanged: ['Solidity', 'Kubernetes', 'Cloud Security'],
        hourlyRateCredits: 1,
        experienceLevel: 'Expert',
        tags: ['M-Pesa', 'Fintech', 'Payments', 'Daraja API', 'Backend'],
        syllabus: [
          'Daraja OAuth2 token generation & password timestamping',
          'STK Push payload anatomy & validation',
          'Asynchronous callback verification & reconciliation',
          'Idempotency & ledger double-entry integrity',
        ],
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        isActive: true,
      },
      {
        id: 'list_6',
        userId: 'user_alex',
        user: {
          name: user1.name,
          avatar: user1.avatar,
          rating: user1.rating,
          completedSwaps: user1.completedSwaps,
          location: user1.location,
        },
        type: 'request',
        title: 'Seeking: Jazz Piano Chords & Improvisation Coach',
        category: 'Music & Audio',
        description: 'Looking for an experienced pianist to teach me 2-5-1 chord progressions, rootless voicings, and basic modal improvisation on an 88-key MIDI keyboard.',
        skillsExchanged: ['React', 'TypeScript', 'Web Development'],
        hourlyRateCredits: 1,
        experienceLevel: 'Beginner',
        tags: ['Piano', 'Jazz', 'Music Theory', 'Chords'],
        syllabus: ['2-5-1 voicings in key of C & F', 'Bossa nova rhythms', 'Blues scale fills'],
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        isActive: true,
      }
    ];

    listings.forEach(l => this.listings.set(l.id, l));

    // Seed Active Swaps & Escrows
    const escrow1: EscrowRecord = {
      id: 'escrow_101',
      swapId: 'swap_201',
      payerId: 'user_alex',
      recipientId: 'user_elena',
      amountCredits: 2.0,
      status: 'locked',
      lockedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    };
    this.escrowRecords.set(escrow1.id, escrow1);

    const swap1: SwapContract = {
      id: 'swap_201',
      requesterId: 'user_alex',
      providerId: 'user_elena',
      requesterName: 'Alex Chen',
      providerName: 'Elena Rodriguez',
      requesterAvatar: user1.avatar,
      providerAvatar: user2.avatar,
      skillTitle: 'Conversational Spanish & Business Fluency Bootcamp',
      category: 'Languages',
      hours: 2,
      totalCredits: 2,
      scheduledDate: new Date(Date.now() + 86400000 * 1).toISOString(),
      status: 'accepted',
      learningGoals: [
        'Practice job interview responses in Spanish',
        'Learn technical and business vocabulary',
        'Receive live accent feedback',
      ],
      sessionNotes: 'Zoom link sent, prep deck on marketing vocabulary attached.',
      escrowId: escrow1.id,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.swapContracts.set(swap1.id, swap1);

    // Initial Transaction History
    this.transactions.push(
      {
        id: 'tx_1',
        userId: 'user_alex',
        type: 'bonus',
        amount: 10.0,
        balanceAfter: 10.0,
        description: 'Welcome Sign-up Bonus (10 Time Credits)',
        timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
      {
        id: 'tx_2',
        userId: 'user_alex',
        type: 'purchase',
        amount: 4.5,
        balanceAfter: 14.5,
        description: 'Purchased 4.5 Hours via Stripe Checkout (Card)',
        referenceId: 'pi_3NxExampleMockStripe',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'tx_3',
        userId: 'user_alex',
        type: 'escrow_lock',
        amount: -2.0,
        balanceAfter: 12.5,
        description: 'Locked 2.0 Credits into P2P Escrow for Spanish Session with Elena Rodriguez',
        referenceId: 'escrow_101',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    );
  }

  // User methods
  getUser(id: string): UserProfile | undefined {
    return this.users.get(id);
  }

  getAllUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }

  updateUser(id: string, updates: Partial<UserProfile>): UserProfile {
    const existing = this.users.get(id);
    if (!existing) throw new Error(`User with ID ${id} not found`);
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Listings methods
  getListings(): SkillListing[] {
    return Array.from(this.listings.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getListing(id: string): SkillListing | undefined {
    return this.listings.get(id);
  }

  createListing(listing: Omit<SkillListing, 'id' | 'createdAt'>): SkillListing {
    const id = `list_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newListing: SkillListing = {
      ...listing,
      id,
      createdAt: new Date().toISOString(),
    };
    this.listings.set(id, newListing);
    return newListing;
  }

  deleteListing(id: string): boolean {
    return this.listings.delete(id);
  }

  // Swap methods
  getSwaps(): SwapContract[] {
    return Array.from(this.swapContracts.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getSwap(id: string): SwapContract | undefined {
    return this.swapContracts.get(id);
  }

  createSwap(swapData: Omit<SwapContract, 'id' | 'createdAt' | 'updatedAt' | 'status'>): SwapContract {
    const id = `swap_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newSwap: SwapContract = {
      ...swapData,
      id,
      status: 'proposed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.swapContracts.set(id, newSwap);
    return newSwap;
  }

  updateSwap(id: string, updates: Partial<SwapContract>): SwapContract {
    const existing = this.swapContracts.get(id);
    if (!existing) throw new Error(`Swap ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.swapContracts.set(id, updated);
    return updated;
  }

  // Escrow methods
  getEscrow(id: string): EscrowRecord | undefined {
    return this.escrowRecords.get(id);
  }

  getAllEscrows(): EscrowRecord[] {
    return Array.from(this.escrowRecords.values());
  }

  createEscrow(escrow: Omit<EscrowRecord, 'id' | 'lockedAt'>): EscrowRecord {
    const id = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newEscrow: EscrowRecord = {
      ...escrow,
      id,
      lockedAt: new Date().toISOString(),
    };
    this.escrowRecords.set(id, newEscrow);
    return newEscrow;
  }

  updateEscrow(id: string, updates: Partial<EscrowRecord>): EscrowRecord {
    const existing = this.escrowRecords.get(id);
    if (!existing) throw new Error(`Escrow ${id} not found`);
    const updated = { ...existing, ...updates };
    this.escrowRecords.set(id, updated);
    return updated;
  }

  // Transactions
  getTransactions(userId?: string): TimeCreditTransaction[] {
    if (userId) {
      return this.transactions.filter(t => t.userId === userId).reverse();
    }
    return [...this.transactions].reverse();
  }

  addTransaction(tx: Omit<TimeCreditTransaction, 'id' | 'timestamp'>): TimeCreditTransaction {
    const newTx: TimeCreditTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    this.transactions.push(newTx);
    return newTx;
  }

  // Payment orders
  createOrder(order: Omit<PaymentOrder, 'id' | 'createdAt'>): PaymentOrder {
    const id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newOrder: PaymentOrder = {
      ...order,
      id,
      createdAt: new Date().toISOString(),
    };
    this.paymentOrders.set(id, newOrder);
    return newOrder;
  }

  getOrder(id: string): PaymentOrder | undefined {
    return this.paymentOrders.get(id);
  }

  updateOrder(id: string, updates: Partial<PaymentOrder>): PaymentOrder {
    const existing = this.paymentOrders.get(id);
    if (!existing) throw new Error(`Order ${id} not found`);
    const updated = { ...existing, ...updates };
    this.paymentOrders.set(id, updated);
    return updated;
  }

  getAllOrders(): PaymentOrder[] {
    return Array.from(this.paymentOrders.values()).reverse();
  }
}

export const dbStore = new DatabaseStore();
