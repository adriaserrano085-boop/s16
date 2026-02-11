// Mock events removed to ensure Supabase dependency

export const attendanceData = {
    presente: 70,
    retraso: 15,
    ausente: 10,
    tarde: 5
};

export const playerAttendanceDetails = [
    { date: '2026-02-06', type: 'Entrenamiento', status: 'Presente' },
    { date: '2026-02-12', type: 'Partido', status: 'Ausente' },
    { date: '2026-02-18', type: 'Entrenamiento', status: 'Presente' },
    { date: '2026-02-20', type: 'Videosesión', status: 'Tarde' }
];
export const playerStats = [
    {
        id: 'mock-p1',
        name: 'Juan Pérez', team: 'RC L\'Hospitalet',
        presente: 12, retraso: 2, ausente: 1,
        titular: 8, jugados: 10, minutos: 65, ensayos: 4, amarillas: 1, rojas: 0, golpes: 2, conversiones: 0
    },
    {
        id: 'mock-p2',
        name: 'María López', team: 'RC L\'Hospitalet',
        presente: 14, retraso: 0, ausente: 1,
        titular: 12, jugados: 12, minutos: 78, ensayos: 1, amarillas: 0, rojas: 0, golpes: 5, conversiones: 15
    },
    {
        id: 'mock-p3',
        name: 'Carlos Ruiz', team: 'RC L\'Hospitalet',
        presente: 9, retraso: 4, ausente: 2,
        titular: 5, jugados: 11, minutos: 45, ensayos: 8, amarillas: 2, rojas: 0, golpes: 1, conversiones: 0
    },
    {
        id: 'mock-p4',
        name: 'Ana García', team: 'RC L\'Hospitalet',
        presente: 11, retraso: 3, ausente: 1,
        titular: 10, jugados: 10, minutos: 80, ensayos: 0, amarillas: 0, rojas: 0, golpes: 8, conversiones: 12
    },
    {
        id: 'mock-p5',
        name: 'Luis Torres', team: 'RC L\'Hospitalet',
        presente: 13, retraso: 1, ausente: 1,
        titular: 7, jugados: 9, minutos: 55, ensayos: 2, amarillas: 0, rojas: 1, golpes: 3, conversiones: 0
    },
    // FC Barcelona
    { name: 'Xavi Costa', team: 'FC Barcelona', titular: 10, jugados: 10, minutos: 75, ensayos: 5, amarillas: 0, rojas: 0, golpes: 1, conversiones: 20 },
    { name: 'Pau Sala', team: 'FC Barcelona', titular: 9, jugados: 10, minutos: 60, ensayos: 2, amarillas: 1, rojas: 0, golpes: 4, conversiones: 0 },
    // CR Sant Cugat
    { name: 'Oriol Pujol', team: 'CR Sant Cugat', titular: 11, jugados: 12, minutos: 80, ensayos: 3, amarillas: 2, rojas: 0, golpes: 10, conversiones: 5 },
    { name: 'Biel Roca', team: 'CR Sant Cugat', titular: 8, jugados: 11, minutos: 50, ensayos: 6, amarillas: 0, rojas: 0, golpes: 2, conversiones: 0 },
    // UE Santboiana
    { name: 'Jordi Mas', team: 'UE Santboiana', titular: 12, jugados: 12, minutos: 78, ensayos: 4, amarillas: 1, rojas: 0, golpes: 5, conversiones: 12 },
    { name: 'Marc Font', team: 'UE Santboiana', titular: 10, jugados: 12, minutos: 70, ensayos: 7, amarillas: 0, rojas: 1, golpes: 1, conversiones: 0 },
    // Valencia RC
    { name: 'Vicente Marzal', team: 'Valencia RC', titular: 8, jugados: 11, minutos: 55, ensayos: 2, amarillas: 3, rojas: 0, golpes: 4, conversiones: 0 },
    { name: 'Toni Belda', team: 'Valencia RC', titular: 11, jugados: 11, minutos: 80, ensayos: 1, amarillas: 1, rojas: 0, golpes: 12, conversiones: 8 }
];
export const weeklyMatches = [
    {
        name: 'Jornada 12',
        home: 'RC L\'Hospitalet',
        away: 'FC Barcelona',
        date: 'Sáb, 16:00',
        league: 'División de Honor B',
        score: '24 - 10',
        homeLogo: 'https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/logo%20hospi.png',
        awayLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1024px-FC_Barcelona_%28crest%29.svg.png'
    },
    {
        name: 'Jornada 12',
        home: 'CR Sant Cugat',
        away: 'UE Santboiana',
        date: 'Dom, 12:30',
        league: 'División de Honor B',
        score: '15 - 15',
        homeLogo: 'https://placehold.co/40x40?text=S.C',
        awayLogo: 'https://placehold.co/40x40?text=UES'
    },
    {
        name: 'Jornada 12',
        home: 'Valencia RC',
        away: 'CAU Valencia',
        date: 'Sáb, 17:00',
        league: 'División de Honor B',
        score: '32 - 24',
        homeLogo: 'https://placehold.co/40x40?text=VRC',
        awayLogo: 'https://placehold.co/40x40?text=CAU'
    },
    {
        name: 'Jornada 12',
        home: 'CP Les Abelles',
        away: 'Ghenova Olavide',
        date: 'Dom, 11:00',
        league: 'División de Honor B',
        score: '10 - 45',
        homeLogo: 'https://placehold.co/40x40?text=CPA',
        awayLogo: 'https://placehold.co/40x40?text=GO'
    }
];
export const leagueStats = [
    { ranking: 1, team: 'RC L\'Hospitalet', favor: 450, contra: 210, dif: 240, ensayos: 58, ensayosPart: 5.2, amarillas: 12, amarillasPart: 1.1, rojas: 1, rojasPart: 0.1, victorias: 85 },
    { ranking: 2, team: 'FC Barcelona', favor: 420, contra: 190, dif: 230, ensayos: 52, ensayosPart: 4.8, amarillas: 10, amarillasPart: 0.9, rojas: 0, rojasPart: 0.0, victorias: 80 },
    { ranking: 3, team: 'CR Sant Cugat', favor: 380, contra: 250, dif: 130, ensayos: 45, ensayosPart: 4.1, amarillas: 15, amarillasPart: 1.4, rojas: 2, rojasPart: 0.2, victorias: 70 },
    { ranking: 4, team: 'UE Santboiana', favor: 410, contra: 230, dif: 180, ensayos: 50, ensayosPart: 4.5, amarillas: 14, amarillasPart: 1.3, rojas: 1, rojasPart: 0.1, victorias: 75 },
    { ranking: 5, team: 'Valencia RC', favor: 350, contra: 300, dif: 50, ensayos: 38, ensayosPart: 3.5, amarillas: 18, amarillasPart: 1.6, rojas: 3, rojasPart: 0.3, victorias: 60 }
];

export const physicalTests = [
    {
        playerName: 'Juan Pérez',
        team: 'RC L\'Hospitalet',
        results: {
            SEP: {
                velocidad: { '10m': '1.82s', '30m': '4.15s', '80m': '10.5s' },
                resistencia: { 'Course-navette': '12.5', 'Bronco test': '4:45' },
                superior: { 'Lanzamiento pecho': '5.2m', 'Lanzamiento cabeza': '6.8m', 'Flexiones': '45' },
                inferior: { 'Salto vertical': '45cm', 'Salto plataforma': '52cm', 'Salto horizontal': '2.10m', 'Salto rebote': '38cm', 'Sentadillas 1min': '52' },
                core: { 'Plancha': '2:30', 'Abdominales 1min': '48' }
            },
            DIC: {
                velocidad: { '10m': '1.78s', '30m': '4.08s', '80m': '10.2s' },
                resistencia: { 'Course-navette': '13.0', 'Bronco test': '4:35' },
                superior: { 'Lanzamiento pecho': '5.5m', 'Lanzamiento cabeza': '7.1m', 'Flexiones': '48' },
                inferior: { 'Salto vertical': '48cm', 'Salto plataforma': '55cm', 'Salto horizontal': '2.20m', 'Salto rebote': '40cm', 'Sentadillas 1min': '55' },
                core: { 'Plancha': '2:45', 'Abdominales 1min': '52' }
            },
            FEB: {
                velocidad: { '10m': '1.75s', '30m': '4.02s', '80m': '10.0s' },
                resistencia: { 'Course-navette': '13.5', 'Bronco test': '4:25' },
                superior: { 'Lanzamiento pecho': '5.8m', 'Lanzamiento cabeza': '7.4m', 'Flexiones': '52' },
                inferior: { 'Salto vertical': '50cm', 'Salto plataforma': '58cm', 'Salto horizontal': '2.30m', 'Salto rebote': '42cm', 'Sentadillas 1min': '58' },
                core: { 'Plancha': '3:00', 'Abdominales 1min': '55' }
            },
            MAY: null // Not performed yet
        }
    },
    {
        playerName: 'María López',
        team: 'RC L\'Hospitalet',
        results: {
            SEP: {
                velocidad: { '10m': '1.95s', '30m': '4.45s', '80m': '11.2s' },
                resistencia: { 'Course-navette': '11.0', 'Bronco test': '5:10' },
                superior: { 'Lanzamiento pecho': '4.8m', 'Lanzamiento cabeza': '6.2m', 'Flexiones': '38' },
                inferior: { 'Salto vertical': '38cm', 'Salto plataforma': '45cm', 'Salto horizontal': '1.90m', 'Salto rebote': '32cm', 'Sentadillas 1min': '45' },
                core: { 'Plancha': '2:00', 'Abdominales 1min': '42' }
            },
            DIC: {
                velocidad: { '10m': '1.90s', '30m': '4.38s', '80m': '10.9s' },
                resistencia: { 'Course-navette': '11.5', 'Bronco test': '5:00' },
                superior: { 'Lanzamiento pecho': '5.0m', 'Lanzamiento cabeza': '6.5m', 'Flexiones': '42' },
                inferior: { 'Salto vertical': '42cm', 'Salto plataforma': '48cm', 'Salto horizontal': '2.00m', 'Salto rebote': '35cm', 'Sentadillas 1min': '48' },
                core: { 'Plancha': '2:15', 'Abdominales 1min': '46' }
            },
            FEB: {
                velocidad: { '10m': '1.85s', '30m': '4.30s', '80m': '10.5s' },
                resistencia: { 'Course-navette': '12.0', 'Bronco test': '4:50' },
                superior: { 'Lanzamiento pecho': '5.2m', 'Lanzamiento cabeza': '6.8m', 'Flexiones': '46' },
                inferior: { 'Salto vertical': '45cm', 'Salto plataforma': '52cm', 'Salto horizontal': '2.10m', 'Salto rebote': '38cm', 'Sentadillas 1min': '52' },
                core: { 'Plancha': '2:30', 'Abdominales 1min': '50' }
            },
            MAY: null
        }
    }
];
