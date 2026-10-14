const { useState, useEffect, useRef } = React;

function App() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [currentTab, setCurrentTab] = useState('surahs'); // 'surahs', 'audio', 'search'
    const [surahs, setSurahs] = useState([]);
    const [selectedSurah, setSelectedSurah] = useState(null);
    const [surahDetails, setSurahDetails] = useState(null);
    const [loadingSurahs, setLoadingSurahs] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // مشغل الصوت
    const [currentAudio, setCurrentAudio] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // قائمة مشاهير القراء للاستماع المباشر (عبر واجهة القرآن الكريم الصوتية العامة API)
    const [reciters] = useState([
        { id: 1, name: 'المنشاوي (مجوّد)', server: 'https://www.islamweb.net/audio/listen.php?audioid=141&type=mp3' },
        { id: 2, name: 'عبد الباسط عبد الصمد', server: 'https://www.islamweb.net/audio/listen.php?audioid=33&type=mp3' },
        { id: 3, name: 'محمود خليل الحصري', server: 'https://www.islamweb.net/audio/listen.php?audioid=51&type=mp3' },
        { id: 4, name: 'ماهر المعيقلي', server: 'https://www.islamweb.net/audio/listen.php?audioid=184&type=mp3' },
        { id: 5, name: 'سعد الغامدي', server: 'https://www.islamweb.net/audio/listen.php?audioid=115&type=mp3' },
    ]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        fetchAllSurahs();
    }, []);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    // جلب قائمة السور من API القرآن الكريم العام
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

    // جلب تفاصيل السورة والآيات
    const fetchSurahDetails = async (surahNumber) => {
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

    const playReciterAudio = (reciter) => {
        if (currentAudio?.id === reciter.id) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            setCurrentAudio(reciter);
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.src = reciter.server;
                audioRef.current.play();
            }
        }
    };

    const filteredSurahs = surahs.filter(s => 
        s.name.includes(searchQuery) || 
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(s.number).includes(searchQuery)
    );

    return React.createElement('div', { className: 'app', style: { maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' } },
        
        // عنصر الصوت المخفي
        React.createElement('audio', { ref: audioRef, onEnded: () => setIsPlaying(false) }),

        // شريط التنقل العلوي
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid var(--border, #eaeaea)' } },
            React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                React.createElement('button', { 
                    onClick: () => { setSelectedSurah(null); setCurrentTab('surahs'); },
                    style: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'surahs' ? 'var(--primary, #10B981)' : 'transparent', color: currentTab === 'surahs' ? '#fff' : 'inherit', cursor: 'pointer', fontWeight: 'bold' }
                }, '📖 المصحف الشريف'),
                React.createElement('button', { 
                    onClick: () => setCurrentTab('audio'),
                    style: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'audio' ? 'var(--primary, #10B981)' : 'transparent', color: currentTab === 'audio' ? '#fff' : 'inherit', cursor: 'pointer', fontWeight: 'bold' }
                }, '🎧 التلاوات الصوتية')
            ),
            React.createElement('button', { 
                onClick: toggleTheme,
                style: { padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border, #ccc)', background: 'var(--bg, #fff)', color: 'inherit', cursor: 'pointer' }
            }, theme === 'dark' ? '☀️ الفاتح' : '🌙 الداكن')
        ),

        // الترويسة الرئيسية
        React.createElement('div', { style: { textAlign: 'center', marginBottom: '30px' } },
            React.createElement('h1', { style: { fontSize: '28px', marginBottom: '8px', color: 'var(--primary, #10B981)' } }, 'القرآن الكريم وتلاواته'),
            React.createElement('p', { style: { opacity: '0.7', fontSize: '14px' } }, 'اقرأ واستمع إلى كتاب الله عز وجل بكل سهولة ويسر')
        ),

        // مشغل الصوت العائم إذا كان يعمل
        currentAudio && React.createElement('div', { style: { background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                React.createElement('span', { style: { fontSize: '24px' } }, isPlaying ? '🔊' : '⏸️'),
                React.createElement('div', null,
                    React.createElement('div', { style: { fontSize: '12px', opacity: '0.7' } }, isPlaying ? 'جاري الاستماع إلى:' : 'متوقف مؤقتاً:'),
                    React.createElement('strong', null, currentAudio.name)
                )
            ),
            React.createElement('button', { 
                onClick: () => playReciterAudio(currentAudio),
                style: { padding: '6px 14px', borderRadius: '6px', background: '#10B981', color: '#fff', border: 'none', cursor: 'pointer' }
            }, isPlaying ? 'إيقاف مؤقت' : 'تشغيل')
        ),

        // المحتوى حسب التبويب النشط
        currentTab === 'surahs' && !selectedSurah && React.createElement('div', null,
            // شريط البحث
            React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('input', { 
                    type: 'text',
                    placeholder: 'ابحث عن اسم السورة...',
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    style: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border, #ccc)', background: 'var(--bg, #fff)', color: 'inherit', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }
                })
            ),
            loadingSurahs ? React.createElement('div', { style: { textAlign: 'center', padding: '40px', opacity: '0.7' } }, '⏳ جاري تحميل السور...') :
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' } },
                filteredSurahs.map(surah => 
                    React.createElement('div', { 
                        key: surah.number,
                        onClick: () => fetchSurahDetails(surah.number),
                        style: { padding: '16px', borderRadius: '10px', border: '1px solid var(--border, #e2e8f0)', background: 'var(--card-bg, #fff)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s' },
                    },
                        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                            React.createElement('span', { style: { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' } }, surah.number),
                            React.createElement('div', null,
                                React.createElement('strong', { style: { fontSize: '16px', display: 'block' } }, surah.name),
                                React.createElement('span', { style: { fontSize: '11px', opacity: '0.6' } }, `${surah.englishName} • ${surah.numberOfAyahs} آية`)
                            )
                        ),
                        React.createElement('span', { style: { fontSize: '12px', opacity: '0.5' } }, surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية')
                    )
                )
            )
        ),

        // عرض تفاصيل السورة والآيات
        currentTab === 'surahs' && selectedSurah && React.createElement('div', null,
            React.createElement('button', { 
                onClick: () => setSelectedSurah(null),
                style: { marginBottom: '20px', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border, #ccc)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '13px' }
            }, '← العودة لقائمة السور'),

            loadingDetails ? React.createElement('div', { style: { textAlign: 'center', padding: '40px', opacity: '0.7' } }, '⏳ جاري تحميل الآيات...') :
            surahDetails && React.createElement('div', null,
                React.createElement('div', { style: { textAlign: 'center', padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', marginBottom: '20px' } },
                    React.createElement('h2', { style: { fontSize: '24px', color: '#10B981', marginBottom: '5px' } }, surahDetails.name),
                    React.createElement('p', { style: { fontSize: '13px', opacity: '0.7' } }, `${surahDetails.englishName} — عدد الآيات: ${surahDetails.numberOfAyahs}`)
                ),
                // البسملة (إذا لم تكن التوبة)
                surahDetails.number !== 9 && React.createElement('div', { style: { textAlign: 'center', fontSize: '20px', fontFamily: 'Traditional Arabic, serif', marginBottom: '20px', color: '#10B981', fontWeight: 'bold' } }, 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'),

                React.createElement('div', { style: { lineHeight: '2.5', fontSize: '18px', textAlign: 'justify', background: 'var(--card-bg, #fff)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)' } },
                    surahDetails.ayahs.map(ayah => 
                        React.createElement('span', { key: ayah.number, style: { fontFamily: 'Traditional Arabic, serif' } },
                            ` ${ayah.text} `,
                            React.createElement('span', { style: { display: 'inline-block', fontSize: '12px', padding: '2px 6px', margin: '0 4px', borderRadius: '50%', border: '1px solid #10B981', color: '#10B981', verticalAlign: 'middle' } }, ayah.numberInSurah)
                        )
                    )
                )
            )
        ),

        // تبويب التلاوات الصوتية
        currentTab === 'audio' && React.createElement('div', null,
            React.createElement('h3', { style: { marginBottom: '15px', fontSize: '18px' } }, '🎙️ نخبة القراء والمشايخ'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
                reciters.map(reciter => 
                    React.createElement('div', { 
                        key: reciter.id,
                        style: { padding: '16px', borderRadius: '10px', border: '1px solid var(--border, #e2e8f0)', background: 'var(--card-bg, #fff)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
                    },
                        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                            React.createElement('span', { style: { fontSize: '22px' } }, '🎧'),
                            React.createElement('strong', { style: { fontSize: '16px' } }, reciter.name)
                        ),
                        React.createElement('button', { 
                            onClick: () => playReciterAudio(reciter),
                            style: { padding: '8px 16px', borderRadius: '8px', background: currentAudio?.id === reciter.id && isPlaying ? '#EF4444' : '#10B981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px' }
                        }, currentAudio?.id === reciter.id && isPlaying ? '⏸️ إيقاف' : '▶️ استماع')
                    )
                )
            )
        ),

        // تذييل الصفحة
        React.createElement('footer', { style: { textAlign: 'center', marginTop: '40px', paddingT: '20px', borderTop: '1px solid var(--border, #eaeaea)', opacity: '0.6', fontSize: '12px' } },
            '📖 موقع القرآن الكريم — صدقة جارية إن شاء الله'
        )
    );
}

ReactDOM.render(React.createElement(App), document.getElementById('root'));
