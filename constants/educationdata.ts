export type LessonDetail = {
  karakteristik?: string[];
  pemicu?: string[];
  kapanBeristirahat?: string[];
  segeraKonsultasi?: string[];
  tipsLatihan?: string[];
  gerakanUtama?: string[];
};

export type EducationLesson = {
  id: number;

  icon?: string;
  color?: string;

  type?: 'warmup' | 'cooldown';

  title: string;
  subtitle?: string;
  description: string;

  duration?: string;
  exercise?: string;
  


  thumbnail?: string;
  gif?: string;
  video?: string;

  hasDetail?: boolean;
  detail?: LessonDetail;
};

export type EducationTopic = {
  id: number;

  type:
    | 'running'
    | 'injury'
    | 'warmup'
    | 'strength';

  title: string;
  description: string;

  icon: string;
  color: string;

  heroDescription: string;

  hasVideo?: boolean;

  lessons: EducationLesson[];
};

export const educationData: EducationTopic[] = [
  // ─── 1. Teknik Berlari — plain (tidak ada sub-card) ──────────────────────
  {
    id: 1,
    title: 'Teknik berlari yang benar',
    description: 'Sempurnakan gaya lari Anda, tingkatkan efisiensi, dan kurangi kelelahan',
    icon: 'walk',
    color: '#D9E2FF',
    heroDescription:
      'Kuasai teknik berlari yang efisien dan bebas cedera. Penyesuaian kecil pada postur dan ritme langkah Anda dapat membuat setiap kilometer terasa lebih ringan.',
    hasVideo: true,
    type: 'running',
    lessons: [
      {
        id: 1,
        title: 'Pertahankan Postur Tubuh yang Tegak',
        description:
          'Bayangkan ada tali yang menarik tubuh Anda ke atas dari bagian atas kepala. Jaga agar sikap tetap terbuka, bahu rileks dan tidak terangkat. Tubuh Anda akan secara alami condong ke depan dari pergelangan kaki, bukan pinggang.',
        },
      {
        id: 2,
        title: 'Optimalkan Pijakan Kaki',
        description:
          'Usahakan mendarat dengan lembut di bagian tengah telapak kaki, menjaga agar massa tubuh tetap di bawah pusat gravitasi tubuh Anda. Mendarat dengan hentakan jauh di depan tubuh bertindak sebagai gaya penggerak dan meningkatkan beban pada sendi-sendi Anda.',
     },
      {
        id: 3,
        title: 'Ayunan Lengan yang Ringkas',
        description:
          'Jaga agar siku sekitar 90 derajat. Ayunkan tangan dari pinggang hingga ke bawah dagu, bukan melintasi tubuh Anda. Tangan rileks tetapi bengkok, sedikit menutup tanpa menggenggam keras.',
      },
    ],
  },

  // ─── 2. Pencegahan Cedera — card (ada sub-halaman) ───────────────────────
  {
    id: 2,
    title: 'Pencegahan Cedera',
    description: 'Rutinitas penguatan yang penting dan protokol pemulihan.',
    icon: 'shield-checkmark',
    color: '#E3E1FF',
    heroDescription:
      'Pahami cara melindungi tubuh Anda dari cedera umum pelari. Strategi pencegahan yang tepat membantu Anda tetap berlatih konsisten sepanjang tahun.',
    hasVideo: false,
    type: 'injury',
    lessons: [
      {
        id: 1,
        title: "Runner's Knee",
        subtitle: '(Patellofemoral Pain Syndrome)',
        description:
          'Nyeri tumpul di sekitar, di bawah, atau di bagian depan tempurung lutut.',
        hasDetail: true,
        detail: {
          karakteristik: [
            'Nyeri berlari seperti berlari di sekitar, di bawah, atau di bagian depan tempurung lutut.',
            'Nyeri bertambah saat berlari menanjak/menurun, berlari dalam waktu lama, atau saat lutut ditekuk lama (bioskop).',
            'Terasa seperti lutut "mengunci" atau terasa kaku setelah duduk lama.',
          ],
          pemicu: [
            'Peningkatan intensitas/jarak lari yang terlalu mendadak.',
            'Berlari di permukaan keras (aspal/beton) atau menggunakan sepatu yang tidak sesuai.',
            'Otot paha depan (quadriceps) yang lemah, atau jalur iliotibial yang terlalu kencang.',
          ],
          kapanBeristirahat: [
            'Rasa sakit atau ngilu tumpul di sekitar atau di bawah tempurung kaki yang selalu muncul setelah mencapai jarak atau durasi lari tertentu.',
            'Nyeri terasa semakin jelas saat Anda melakukan aktivitas lutut yang lebih berat seperti memanjat/menuruni tangga, berjongkok, duduk tekuk, atau lutut ditekuk (movie theater sign).',
            'Lutut Anda terasa gemetar atau tidak stabil saat lutut ditekuk atau diluruskan, disertai rasa tidak nyaman.',
          ],
          segeraKonsultasi: [
            'Sakit tidak lagi seperti biasa: sekarang tajam dan intens, melainkan tajam ke tulang rawan dan ingin meminta Anda berhenti berjalan biasa.',
            'Lutut mengalami pembengkakan secara signifikan, terasa hangat saat disentuh, atau terlihat lebih besar dibandingkan lutut yang sehat.',
            'Lutut terasa tidak stabil (seperti ingin lepas melompong tanggal) atau terasa "terkunci"/"terhenti" sehingga tidak bisa diluruskan/ditekuk secara penuh.',
            'Setelah melakukan istirahat selama beberapa hari, nyeri kembali muncul segera setelah Anda mulai berjalan atau bahkan saat berjalan biasa.',
          ],
        },
      },
      {
        id: 2,
        title: 'Shin Splints',
        subtitle: '(Medial Tibial Stress Syndrome)',
        description:
          'Rasa sakit berdenyut atau nyeri tajam di bagian depan atau sisi dalam tulang kering.',
        hasDetail: true,
        detail: {
          karakteristik: [
            'Nyeri berdenyut atau nyeri tajam di sepanjang tepi tulang kering bagian dalam.',
            'Nyeri biasanya terasa saat memulai lari dan mereda setelah pemanasan, namun kembali setelah berlari selesai.',
            'Area tulang kering terasa nyeri jika ditekan.',
          ],
          pemicu: [
            'Peningkatan intensitas/jarak lari yang terlalu mendadak, berlari di permukaan keras (aspal/beton).',
            'Berlari dengan sepatu yang sudah aus atau tidak memberikan dukungan yang cukup.',
            'Menggunakan sepatu yang terlalu datar tanpa lengkungan yang tepat.',
          ],
          kapanBeristirahat: [
            'Nyeri di tulang kering yang terasa di awal lari dan hilang setelah pemanasan — tetapi kembali setelah sesi selesai.',
            'Area tulang kering terasa sangat nyeri saat ditekan secara spesifik di titik tertentu.',
          ],
          segeraKonsultasi: [
            'Nyeri tajam yang tidak hilang setelah istirahat beberapa hari.',
            'Tulang kering bengkak atau terasa panas.',
            'Nyeri terasa saat berjalan biasa atau bahkan saat istirahat.',
          ],
        },
      },
      {
        id: 3,
        title: 'Plantar Fasciitis',
        subtitle: '',
        description:
          'Nyeri tajam seperti tertusuk di bagian bawah tumit, sering terasa paling parah pada langkah-langkah pertama di pagi hari.',
        hasDetail: true,
        detail: {
          karakteristik: [
            'Nyeri tajam di bagian bawah tumit atau sepanjang lengkungan kaki.',
            'Paling parah pada langkah pertama di pagi hari atau setelah duduk lama.',
            'Nyeri biasanya berkurang setelah beberapa langkah tetapi bisa kembali setelah aktivitas panjang.',
          ],
          pemicu: [
            'Berlari terlalu banyak di permukaan keras dengan sepatu yang tidak memiliki bantalan lengkungan yang baik.',
            'Otot betis yang kencang memberi tekanan lebih pada plantar fascia.',
            'Menggunakan sepatu dengan bentuk flat feet atau lingkungan tinggi (high arches).',
          ],
          kapanBeristirahat: [
            'Nyeri tumit yang signifikan pada langkah pertama setiap pagi.',
            'Ketidaknyamanan yang terasa setelah berlari dalam waktu lama.',
          ],
          segeraKonsultasi: [
            'Nyeri tidak berkurang setelah 2-3 minggu istirahat dan peregangan.',
            'Pembengkakan di area tumit.',
            'Nyeri menjalar ke betis atau telapak kaki secara keseluruhan.',
          ],
        },
      },
    ],
  },

  // ─── 3. Pemanasan & Pendinginan — card ───────────────────────────────────
  {
    id: 3,
    title: 'Pemanasan & Pendinginan',
    description:
      'Lakukan peregangan dinamis untuk memulai dan peregangan statis untuk mengakhiri sesi dengan benar.',
    icon: 'pulse',
    color: '#6BFF8F',
    heroDescription:
      'Pemanasan dan pendinginan yang tepat adalah bingkai dari setiap sesi lari yang baik. Ini bukan opsional — ini adalah bagian dari latihan itu sendiri.',
    hasVideo: true,
    type: 'warmup',
    lessons: [
      {
        id: 1,
        title: 'High knees',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Mengaktifkan otot fleksor pinggul dan bokong (glutes), serta melatih postur angkatan kaki yang ideal saat berlari.',
        hasDetail: false,
        type: 'warmup',
      },
     {
        id: 2,
        title: 'Butt Kiks',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Memanaskan otot paha belakang (hamstrings) secara aktif dan meningkatkan kelincahan langkah kaki.',
        hasDetail: false,
        type: 'warmup',
      },
      {
        id: 3,
        title: 'Leg Swings',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Membuka mobilitas sendi pinggul agar jangkauan langkah (stride) lebih leluasa dan tidak kaku.',
        hasDetail: false,
        type: 'warmup',
      },
      {
        id: 4,
        title: 'Walking Lunges',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Membangunkan kelompok otot besar (paha depan, paha belakang, dan bokong) sekaligus melatih keseimbangan tubuh.',
        hasDetail: false,
        type: 'warmup',
      },
      {
        id: 5,
        title: 'Jumping Jack',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Gerakan kardio menyeluruh untuk menaikkan detak jantung dengan cepat dan menyelaraskan koordinasi tubuh.',
        hasDetail: false,
        type: 'warmup',
      },
      {
        id: 6,
        title: 'Hamstring streach',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Mengaktifkan otot fleksor pinggul dan bokong (glutes), serta melatih postur angkatan kaki yang ideal saat berlari.',
        hasDetail: false,
        type: 'cooldown',
      },
     {
        id: 7,
        title: 'Butt Kiks',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Memanaskan otot paha belakang (hamstrings) secara aktif dan meningkatkan kelincahan langkah kaki.',
        hasDetail: false,
        type: 'cooldown',
      },
      {
        id: 8,
        title: 'Leg Swings',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Membuka mobilitas sendi pinggul agar jangkauan langkah (stride) lebih leluasa dan tidak kaku.',
        hasDetail: false,
        type: 'cooldown',
      },
      {
        id: 9,
        title: 'Walking Lunges',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Membangunkan kelompok otot besar (paha depan, paha belakang, dan bokong) sekaligus melatih keseimbangan tubuh.',
        hasDetail: false,
        type: 'cooldown',
      },
      {
        id: 10,
        title: 'Jumping Jack',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Gerakan kardio menyeluruh untuk menaikkan detak jantung dengan cepat dan menyelaraskan koordinasi tubuh.',
        hasDetail: false,
        type: 'cooldown',
      },
    ],
  },

  // ─── 4. Latihan Kekuatan — card ───────────────────────────────────────────
  {
    id: 4,

    title: 'Latihan Kekuatan',

    description:
      'Bangun kekuatan otot untuk meningkatkan performa lari, menjaga stabilitas tubuh, dan membantu mengurangi risiko cedera.',

    icon: 'barbell',

    color: '#FFE5D6',

    heroDescription:
      'Pelari yang kuat adalah pelari yang efisien. Latihan kekuatan yang tepat sasaran membantu setiap langkah lebih bertenaga dan melindungi tubuh dari cedera berulang.',

    hasVideo: false,

    type: 'strength',

    lessons: [

      {
        id: 1,

        icon: 'barbell',
        color: '#FFE5D6',

        title: 'Strength',

        subtitle:
          'Otot kaki & inti',

        description:
          '',

        hasDetail: true,
      },

      {
        id: 2,

        icon: 'body',
        color: '#D9E2FF',

        title: 'Core',

        subtitle:
          'Stabilitas postur',

        description:
          '',

        hasDetail: true,
      },

      {
        id: 3,

        icon: 'walk',
        color: '#CFFFE2',

        title: 'Mobility',

        subtitle:
          'Rentang gerak',

        description:
          '',

        hasDetail: true,
      },

      {
        id: 4,

        icon: 'moon',
        color: '#ECECEC',

        title: 'Recovery',

        subtitle:
          'Pemulihan otot',

        description:
          '',

        hasDetail: true,
      },

    ],
  },
];