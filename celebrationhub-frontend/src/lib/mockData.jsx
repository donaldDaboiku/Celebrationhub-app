export const mockAnalytics = {
  monthSummary: {
    birthdays: 45,
    birthdayTrend: 12,
    messages: 135,
    messageTrend: 8,
    deliveryRate: 97.8,
    deliveryTrend: 2
  },
  totalMembers: 520,
  newMembersThisMonth: 35,
  growthData: [
    { month: "Nov", count: 450 },
    { month: "Dec", count: 485 },
    { month: "Jan", count: 520 }
  ],
  upcoming: [
    {
      day: "29",
      month: "JAN",
      count: 2,
      type: "birthdays",
      names: ["John Doe", "Jane Smith"]
    },
    {
      day: "30",
      month: "JAN",
      count: 1,
      type: "anniversary",
      names: ["Mr & Mrs Johnson"]
    }
  ],
  delivery: {
    email: 98,
    sms: 96,
    whatsapp: 95
  }
};

export const mockTemplates = [
  {
    id: 1,
    name: "Classic Blue Birthday",
    type: "birthday",
    description: "Timeless blue design with balloons",
    previewUrl: "https://via.placeholder.com/600x400/4f46e5/ffffff?text=Classic+Blue",
    backgroundUrl: "/storage/templates/classic-blue-bg.png",
    isPublic: true
  },
  {
    id: 2,
    name: "Elegant Purple",
    type: "birthday",
    description: "Sophisticated purple theme",
    previewUrl: "https://via.placeholder.com/600x400/9333ea/ffffff?text=Elegant+Purple",
    backgroundUrl: "/storage/templates/elegant-purple-bg.png",
    isPublic: true
  },
  {
    id: 5,
    name: "Golden Anniversary",
    type: "anniversary",
    description: "Luxurious gold design",
    previewUrl: "https://via.placeholder.com/600x400/fbbf24/ffffff?text=Golden+Anniversary",
    backgroundUrl: "/storage/templates/golden-bg.png",
    isPublic: true
  }
];

export const mockCredits = {
  balance: 245,
  transactions: [
    {
      id: 123,
      type: "purchase",
      amount: 500,
      balanceAfter: 745,
      reference: "PSK_abc123def",
      createdAt: "2026-01-28T14:30:00Z"
    },
    {
      id: 122,
      type: "usage",
      amount: -1,
      balanceAfter: 245,
      reference: null,
      createdAt: "2026-01-28T09:15:00Z"
    }
  ]
};