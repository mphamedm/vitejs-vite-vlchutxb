import { useState, useEffect, useRef } from 'react';

export default function App() {
    const [currentTab, setCurrentTab] = useState('surahs');
    const [surahs, setSurahs] = useState<any[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<any>(null);
    const [surahDetails, setSurahDetails] = useState<any>(null);
    const [loadingSurahs, setLoadingSurahs] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentAudio, setCurrentAudio] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // قائمة القراء بروابط بث مباشرة ومستقرة (سورة الفاتحة نموذجاً)
    const reciters = [
        { id: 1, name: 'مشاري العفاسي', server: 'https://server8.mp3quran.net/afs/001.mp3' },
        { id: 2, name: 'ماهر المعيقلي', server: 'https://server11.mp3quran.net/maher/001.mp3' },
        { id: 3, name: 'عبد الباسط عبد الصمد', server: 'https://server7.mp3quran.net/basit/001.mp3' },
        { id: 4, name: 'محمد صديق المنشاوي', server: 'https://server10.mp3quran.net/minsh/001.mp3' },
        { id: 5, name: 'عبد الرحمن السديس', server: 'https://server11.mp3quran.net/sds/001.mp3' },
    ];

    useEffect(() => {
        fetchAllSurahs();
    }, []);

    const fetchAllSurahs = async () => {
        setLoadingSurahs(true);
        try {
            const res = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await res.json();
            if (data.code === 200) {
                setSurahs(data.data);
            }
        } catch (error) {
            console.error('Error fetching surahs:', error);
        } finally {
            setLoadingSurahs(false);
        }
    };

    const fetchSurahDetails = async (surahNumber: number) => {
        setLoadingDetails(true);
        try {
            const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
            const data = await res.json();
            if (data.code === 200) {
                setSurahDetails(data.data);
                setSelectedSurah(surahNumber);
            }
        } catch (error) {
            console.error('Error fetching surah details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const playReciterAudio = (reciter: any) => {
        if (!audioRef.current) return;

        if (currentAudio?.id === reciter.id) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch(err => console.error("Playback error:", err));
            }
        } else {
            setCurrentAudio(reciter);
            audioRef.current.src = reciter.server;
            audioRef.current.load();
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.error("Audio loading error:", err);
            });
        }
    };

    const filteredSurahs = surahs.filter(s => 
        s.name.includes(searchQuery) || 
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(s.number).includes(searchQuery)
    );

    return (
        <div className="app" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh' }}>
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

            {/* شريط التنقل العلوي */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #2a2a2a' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => { setSelectedSurah(null); setCurrentTab('surahs'); }}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'surahs' ? '#10B981' : '#1e1e1e', color: currentTab === 'surahs' ? '#fff' : '#b0b0b0', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        📖 المصحف الشريف
                    </button>
                    <button 
                        onClick={() => setCurrentTab('audio')}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'audio' ? '#10B981' : '#1e1e1e', color: currentTab === 'audio' ? '#fff' : '#b0b0b0', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        🎧 التلاوات الصوتية
                    </button>
                </div>
            </div>

            {/* العنوان */}
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#34D399' }}>القرآن الكريم وتلاواته</h1>
                <p style={{ opacity: '0.7', fontSize: '14px', color: '#9ca3af' }}>اقرأ واستمع إلى كتاب الله عز وجل بكل سهولة ويسر</p>
            </div>

            {/* البسملة البارزة في الأعلى */}
            <div style={{ textAlign: 'center', fontSize: '24px', marginBottom: '25px', color: '#34D399', fontWeight: 'bold', fontFamily: 'Traditional Arabic, serif', letterSpacing: '1px' }}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            {/* مشغل الصوت */}
            {currentAudio && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>{isPlaying ? '🔊' : '⏸️'}</span>
                        <div>
                            <div style={{ fontSize: '12px', opacity: '0.7' }}>{isPlaying ? 'جاري الاستماع إلى:' : 'متوقف مؤقتاً:'}</div>
                            <strong style={{ color: '#fff' }}>{currentAudio.name}</strong>
                        </div>
                    </div>
                    <button 
                        onClick={() => playReciterAudio(currentAudio)}
                        style={{ padding: '6px 14px', borderRadius: '6px', background: '#10B981', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                        {isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                    </button>
                </div>
            )}

            {/* قائمة السور */}
            {currentTab === 'surahs' && !selectedSurah && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <input 
                            type="text"
                            placeholder="ابحث عن اسم السورة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #333', background: '#1e1e1e', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>
                    {loadingSurahs ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: '0.7' }}>⏳ جاري تحميل السور...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                            {filteredSurahs.map((surah: any) => (
                                <div 
                                    key={surah.number}
                                    onClick={() => fetchSurahDetails(surah.number)}
                                    style={{ padding: '16px', borderRadius: '10px', border: '1px solid #2a2a2a', background: '#1e1e1e', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>{surah.number}</span>
                                        <div>
                                            <strong style={{ fontSize: '16px', display: 'block', color: '#fff' }}>{surah.name}</strong>
                                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{surah.englishName} • {surah.numberOfAyahs} آية</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* تفاصيل السورة والآيات */}
            {currentTab === 'surahs' && selectedSurah && (
                <div>
                    <button 
                        onClick={() => setSelectedSurah(null)}
                        style={{ marginBottom: '20px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #333', background: '#1e1e1e', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
                    >
                        ← العودة لقائمة السور
                    </button>

                    {loadingDetails ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: '0.7' }}>⏳ جاري تحميل الآيات...</div>
                    ) : surahDetails && (
                        <div>
                            <div style={{ textAlign: 'center', padding: '20px', background: '#1e1e1e', borderRadius: '12px', marginBottom: '20px', border: '1px solid #2a2a2a' }}>
                                <h2 style={{ fontSize: '24px', color: '#34D399', marginBottom: '5px' }}>{surahDetails.name}</h2>
                                <p style={{ fontSize: '13px', color: '#9ca3af' }}>{surahDetails.englishName} — عدد الآيات: {surahDetails.numberOfAyahs}</p>
                            </div>
                            {surahDetails.number !== 9 && (
                                <div style={{ textAlign: 'center', fontSize: '22px', marginBottom: '20px', color: '#34D399', fontWeight: 'bold' }}>
                                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                </div>
                            )}
                            <div style={{ lineHeight: '2.8', fontSize: '20px', textAlign: 'justify', padding: '25px', borderRadius: '12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#f3f4f6' }}>
                                {surahDetails.ayahs.map((ayah: any) => (
                                    <span key={ayah.number}>
                                        {` ${ayah.text} `}
                                        <span style={{ display: 'inline-block', fontSize: '12px', padding: '2px 6px', margin: '0 4px', borderRadius: '50%', border: '1px solid #34D399', color: '#34D399', verticalAlign: 'middle' }}>
                                            {ayah.numberInSurah}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* التلاوات الصوتية */}
            {currentTab === 'audio' && (
                <div>
                    <h3 style={{ marginBottom: '15px', fontSize: '18px', color: '#fff' }}>🎙️ نخبة القراء والمشايخ</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {reciters.map(reciter => (
                            <div 
                                key={reciter.id}
                                style={{ padding: '16px', borderRadius: '10px', border: '1px solid #2a2a2a', background: '#1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '22px' }}>🎧</span>
                                    <strong style={{ fontSize: '16px', color: '#fff' }}>{reciter.name}</strong>
                                </div>
                                <button 
                                    onClick={() => playReciterAudio(reciter)}
                                    style={{ padding: '8px 16px', borderRadius: '8px', background: currentAudio?.id === reciter.id && isPlaying ? '#EF4444' : '#10B981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    {currentAudio?.id === reciter.id && isPlaying ? '⏸️ إيقاف' : '▶️ استماع'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <footer style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #2a2a2a', color: '#9ca3af', fontSize: '12px' }}>
                📖 موقع القرآن الكريم — صدقة جارية إن شاء الله
            </footer>
        </div>
    );
}
