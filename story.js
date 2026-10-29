/* ============================================================
    ✏️ 이야기 파일 — 여기만 고치면 됩니다! (story.js)

    * 따옴표("")와 쉼표(,) 위치만 조심하세요.
    * 글 안에서 줄을 바꾸고 싶으면 \n 을 쓰세요. (엔터로 줄을 바꾸면 오류가 나요!)
    * "//" 로 시작하는 줄은 설명이라서 지워도, 남겨도 상관없어요.
    * 시간 단위는 전부 "초" 예요.
    * 항목이 여러 개일 때는 { ... }, { ... }, { ... } 처럼 항목 사이마다 쉼표(,)가 꼭 있어야 해요.
    * 【샘플】 이라고 적힌 곳은 제가 예시로 채워 둔 내용이에요. 자유롭게 바꾸거나 지우세요.
    * 사진은 images 폴더, 음악 파일(mp3)은 audio 폴더에 넣고 경로를 적으면 돼요.
    ============================================================ */

const STORY = {

  /* ---------- 1. 기본 설정 ---------- */
  owner: "최수현",                    // 폰 주인 이름 (브라우저 탭 제목에 쓰여요)
  passcode: "1225",                   // 잠금 해제 비밀번호 (숫자, 자릿수는 자유)
  hint: "기념일",                     // 두 번 틀리면 보여줄 힌트 (필요 없으면 "")
  network: "5G",                      // 상단 통신망 표시 ("5G", "3G", "Wi-Fi" 등)
  battery: 7,                         // 시작 배터리 % (잠금을 풀면 점점 줄어들어요)
  playTime: 300,                      // ★ 잠금을 푼 뒤 폰이 켜져 있는 시간(초). 300 = 5분. 이후 화면이 꺼져요
  time: { start: "23:47", date: "10월 21일 수요일" },
                                      // 이야기 속 시작 시간. 실제 시간을 쓰려면 start: "auto"
  dark: false,                        // true 로 하면 다크 모드 (메시지/메모 등이 어두운 색)
  sound: true,                        // 알림음, 벨소리 켜기/끄기
  speed: 1,                           // 테스트용 배속. 3 이면 3배 빠르게 진행 (완성 후엔 1로)

  // 배경 화면. 색 그라데이션 또는 사진: "url(images/wall.jpg) center / cover"
  wallpaper: "radial-gradient(120% 80% at 15% 8%, #7a86ff 0%, transparent 55%), radial-gradient(110% 80% at 90% 92%, #ff8db0 0%, transparent 55%), linear-gradient(160deg, #2a2e6a, #12142b)",

  // 홈 화면에 둘 앱. 쓸 수 있는 이름: messages, phone, photos, notes, web, music, calendar, clock
  layout: {
    grid: ["photos", "notes", "calendar", "clock"],     // 홈 화면
    dock: ["phone", "messages", "web", "music"]         // 맨 아래 고정 줄 (4개까지)
  },

  // 잠금 화면에 처음부터 떠 있는 알림 (필요 없으면 [] 로)
  lockNotifications: [
    { app: "메시지", title: "고유림", body: "왜 연락 안 받아?", time: "방금" },
    { app: "메시지", title: "고유림", body: "너 어디 간 건데", time: "방금" },
    { app: "메시지", title: "고유림", body: "제발 전화 좀 받아", time: "방금" },
    { app: "전화", title: "부재중 고유림 15", time: "방금" },
    { app: "전화", title: "부재중 개념녀 27", time: "방금" }
  ],


  /* ---------- 2. 등장인물(연락처) ----------
     history  : 처음부터 있는 지난 대화 (from: "me" 는 내가 보낸 것, "them" 은 상대)
     replies  : 내가 타자로 보낸 문자에 어떻게 답할지 (위에서부터 먼저 맞는 것 하나만 적용)
                match     → 내 문자에 이 단어들이 들어 있으면
                say       → 이렇게 답장함 (여러 개면 연달아 옴)
                then      → 답장 뒤에 이 id 의 사건을 이어서 실행 (선택)
                after     → 이 이름의 사건/표시가 이미 있을 때만 이 규칙 사용 (선택)
                set       → 이 규칙이 쓰이면 "표시"를 남김. 다른 규칙의 after 에 같은 이름을 쓰면
                             "앞에서 그 말을 했을 때만" 쓰이는 규칙을 만들 수 있어요 (선택)
                once      → true 면 한 번만 사용 (선택)
                delay     → 답장 오기까지 기다리는 초 (선택, 기본 1.2)
     fallback : 아무 규칙에도 안 맞을 때 돌려가며 하는 답 ([] 이면 읽씹)
     onCall   : 내가 연락처에서 전화를 걸 때 실행할 통화 사건의 id (선택)
     hidden   : true 면 연락처 목록에 안 보임 (모르는 번호 등)
     ------------------------------------------------------------ */
  contacts: {

    yurim: {
      name: "고유림",
      color: "#ff9f43",
      history: [
        { day: "10월 1일" },
        { from: "them", text: "어디야?", time: "오후 6:02" },
        { from: "me",   text: "학교", time: "오후 6:10" },
        { from: "them", text: "교실로 와\n아무도 없어", time: "오후 6:11" },
        { day: "10월 2일" },
        { from: "them", text: "최수현 일어나~~", time: "오전 7:10" },
        { from: "me",   text: "우으ㅡ", time: "오전 7:18" },
        { from: "me",   text: "전화그ㅡ만걸으ㅓ......", time: "오전 7:18" },
        { from: "them", text: "ㅋㅋㅋ 빨리 일어나", time: "오전 7:19" }
      ],
      replies: [
        { match: ["안녕", "고유림"],         say: ["최수현?", "너 어디야?"] },
        { match: ["몰라"],                  say: ["모르는 게 어딨어", "그게 무슨 말이야"] },
        { match: ["전화 못"],               say: ["왜 못 받는데?"] },
        { match: ["미안"],                  say: ["뭐가 미안한데 그냥 전화 받으면 되잖아"] },
        { match: ["모르겠어"],              say: ["대답 좀 해줘 응?"] },
        { match: ["전화 받았","전화받"],      say: ["무슨 일인지 알려줘"] },
        { match: ["집"],                    say: ["아닌거 알아"] },
        { match: ["무슨"],                  say: ["수현아 나 못 믿어?", "네가 알려줘야 널 도와줄 수 있어"] },
        { match: ["응아니야", "ㅇㅇㄴㅇ"],     say: ["걱정돼서 그래"] },
        { match: ["응아니야", "ㅇㅇㄴㅇ"],     say: ["너 최수현 아니지", "너 누구야"], after: "yuriminji" },
        { match: ["무슨", "어떻게"],        say: ["누구냐고 개새끼야", "최수현 어디갔어", "최수현 어디있냐고"], after: "yuriminji" },
        { match: ["도와", "신고", "경찰"],    say: ["경찰 안 부를게, 그러니까 전화로 대답만 해줘", "제발 수현아"], set: "yuriminji" },
        { match: ["마약"],                  say: ["뭐...?", "그게 무슨 말이야"] }
      ], 
      fallback: ["어디야", "전화 받아", "최수현 제발", "무슨 일이 있었던 건데"]
    },

    omaekun: {
      name: "너구리",
      color: "#5ac8fa",
      history: [
        { from: "me",   text: "내일 뭐함?", time: "오후 9:30" },
        { from: "them", text: "나 약속 있음", time: "오후 9:41" }
      ],
      replies: [
        { match: ["야", "너구리"], say: ["최수현?", "야 너"] },
        { match: ["ㅋㅋ", "ㅎㅎ"],  say: ["아니 너 어딘데"] }
      ],
      fallback: ["너 지금 어떤 상황인지는 알아?", "고유림이랑 개념녀가 너를 얼마나....", "하....", "아니 경찰에 연락을 해", "고유림 연락 받았어?", "개념녀랑 연락 했어?"]
    },

    gaenyeom: {
      name: "개념녀",
      color: "#bf5af2",
      history: [
        { from: "me",   text: "나 지금 도서관임", time: "오후 12:23" },
        { from: "them", text: "갈게", time: "오후 12:24" }
      ],
      replies: [
        { match: ["안녕", "도와줘"], say: ["최수현?", "지금 어디야"] },
        { match: ["미안"],         say: ["미안하면 전화를 받아"] },
{ match: ["안 보냈", "안보냈","보"], say: ["너 맞잖아"] },

        { 
          match: ["응아니야", "ㅇㅇㄴㅇ", "박서영", "념녀", "서영", "념녀수현", "하도율", "양지호", "도율", "레전드", "와", "대박", "싫어", "다른", "알겠", "아니", "왜", "무슨"], 
          say: ["너 최수현 아니구나"], 
          set: "nyeominji" 
        },
        { 
          match: ["어떻게", "헐","무슨", "아니", "맞", "뭔", "최수현", "나", "응아니야", "소름", "와", "엥", "아님", "아", "어", "사", "구", "나", "든", "박서영", "념녀", "서영", "념녀수현", "하도율", "양지호", "도율", "레전드", "대박", "싫어", "다른", "알겠"], 
          say: ["누구야 너?", "최수현 어디갔어", "최수현 어디갔냐고"], 
          after: "nyeominji" 
        },
        { 
          match: ["어디"], 
          say: ["그건 내가 묻고 싶은데"] 
        }
      ],
      fallback: ["너 누구야?", "너 최수현 아니잖아", "최수현 어디있어?"]
    },

    unknown: {
      name: "모르는 번호",
      color: "#8e8e93",
      hidden: true,
      history: [],
      replies: [
        { match: ["누구", "누군", "who"], say: ["왜 갑자기 모르는 척이야?"], once: true, after: "unknownText" },
        { match: ["???", "뭐"],         say: ["내일 밤에 얘기하자."] }
      ],
      fallback: []
    },

    doyul: {
      name: "하도율",
      color: "#8e8e93",
      history: [],
      replies: [
        { match: ["야", "도율", "뭐"],  say: ["엥?", "뭐야", "아니 고유림한테 답장이나 해"] },
        { match: ["미쳤", "무슨"],     say: ["아니 니 무;;슨 짓을 하고 다니는겨.", "니가 변의주냐?"] },
        { match: ["변의주", "의주", "쭈"], say: ["아니 나크루를 봐야지", "내가 트윗썻잔아ㅡㅡ", "니콜라스가 경찰인가뭔가 무리한 설정이잇는그포타그거ㅡㅡ"] },
        { match: ["유림수현", "유수"],     say: ["응아니야"] },
        { match: ["개념녀", "념녀"],     say: ["응 념녀한테 가"] },
        { match: ["념수", "념녀수현"],     say: ["이건 ㅇㅈ이지요ㅋㅋ", "념녀수현이라고 햇으니까 힌트를 줄게", "나랑 대화를 오래 해봐바"] },

        // ★ 1. [after]가 붙은 화난 이후 규칙을 '위'에 배치
        { 
          match: ["내가뭘", "내가 뭘", "무슨일", "무슨 일", "뭔일", "왜그", "왜 그"], 
          say: ["몰라서 물어?", "마약 운반이 먼 얘긴데 수현아;;;;", "당황스럽네진짜"],
          after: "doyulAngry" 
        },
        { 
          match: ["마약"], 
          say: ["내가 너한테 물어볼 입장이거든;;;;;;;;;"],
          after: "doyulAngry" 
        },

        // ★ 2. 처음으로 화나게 만드는 규칙을 '아래'에 배치
        { 
          match: ["왜", "뭐", "무슨", "뭔"],  
          say: ["너진짜왜이러는거야.........", "아니", "하........."],
          set: "doyulAngry" 
        }
      ],
      fallback: ["나랑 얘기 할 생각하지말어 개념녀랑 해", "념녀한테 말해", "나랑얘기할거면념녀수현VS유림수현 토론해야됨"]
    }

  },


  /* ---------- 3. 지난 통화 기록 ---------- */
  callLog: [
    { cid: "gaenyeom", name: "개념녀",     kind: "부재중", time: "오후 7:17" },
    { cid: "omaekun",  name: "너구리",     kind: "부재중", time: "오후 7:16" },
    { cid: "gaenyeom", name: "개념녀",     kind: "부재중", time: "오후 7:14" },
    { cid: "yurim",    name: "고유림",     kind: "부재중", time: "오후 7:14" },
    { cid: "yurim",    name: "고유림",     kind: "부재중", time: "오후 7:13" },
    { cid: "yurim",    name: "고유림",     kind: "부재중", time: "오후 7:12" },
    { cid: "yurim",    name: "고유림",     kind: "발신",   time: "오후 7:12" },
    { cid: "yurim",    name: "고유림",     kind: "부재중", time: "오후 7:12" },
    { name: "모르는 번호",                 kind: "수신",   time: "오후 9:48" },
    { cid: "yurim",    name: "고유림",     kind: "발신",   time: "어제" },
    { cid: "yurim",    name: "고유림",     kind: "수신",   time: "어제" },
    { cid: "yurim",    name: "고유림",     kind: "발신",   time: "어제" },
    { cid: "gaenyeom", name: "개념녀",     kind: "발신",   time: "어제" }
  ],


  /* ---------- 4. 사건(이야기의 흐름) ---------- */
  events: [
    { id: "yurimText", at: 5, type: "message", from: "yurim",
      texts: ["최수현 어디야", "연락 좀 봐 제발"],
      then: "yurimCall", thenDelay: 2 },

    { id: "yurimCall", type: "call", from: "yurim", ring: 20,
      retry: { times: 3, every: 18 },
      lines: [
        { who: "them", text: "여보세요? 최수현?" },
        { who: "them", text: "너 어디야" },
        { who: "them", text: "수현아 제발 대답 좀 해줘" },
        { who: "them", text: "왜 아무 말도 없어" },
        { who: "them", text: "수현아 제발" },
        { who: "them", text: "대답 좀 해줘, 응?" }
      ],
      voicemail: "최수현. 나야. 이거 들으면 바로 전화해. 아무 말 안 해도 되니까 그냥 받아만 줘. 제발.",
      onDecline: "", onMiss: "yurimDeclined" },

    { id: "yurimDeclined", type: "message", from: "yurim",
      texts: ["최수현", "아무 답장이라도 괜찮으니까 보내줘"] },

    { id: "unknownText", at: 45, type: "message", from: "unknown",
      texts: ["내일 밤 12시. 약속 잊지 마."] },

    { id: "omaekunCall", at: 28, type: "call", from: "omaekun", ring: 16,
      lines: [
        { who: "them", text: "야 최수현!" },
        { who: "them", text: "너 지금 어디야" },
        { who: "them", text: "애들 난리 났어" },
        { who: "them", text: "일단 경찰에 연락부터 해. 응?" }
      ],
      onMiss: "omaekunMissed" },

    { id: "omaekunMissed", type: "message", from: "omaekun",
      texts: ["야 전화 좀 받아", "너 뭐하는데"] },

    { id: "gaenyeomText", at: 62, type: "message", from: "gaenyeom",
      texts: ["최수현", "전화 받아"],
      then: "gaenyeomCall", thenDelay: 2 },

    { id: "gaenyeomCall", type: "call", from: "gaenyeom", ring: 18,
      retry: { times: 2, every: 16 },
      lines: [
        { who: "them", text: "드디어 받았다" },
        { who: "them", text: "다들 너 찾고 있어" },
        { who: "them", text: "어디야?" },
        { who: "them", text: "야 최수현" },
        { who: "them", text: "수현아 제발......" }
      ],
      voicemail: "최수현 어디야? 왜 연락 안 받아" },

    { 
      id: "gaenyeomPhoto", 
      at: 120, 
      type: "message", 
      from: "gaenyeom",
      texts: [
        { img: { src: "images/photo15.png" }, text: "이거 네가 보낸 거 맞지?" }, 
        "대답 좀 해줘"
      ] 
    },

    { id: "doyulText", at: 95, type: "message", from: "doyul",
      texts: ["야", "너 어디냐", "답떠"],
      then: "doyulCall", thenDelay: 4 },

    { id: "doyulCall", type: "call", from: "doyul", ring: 16,
      lines: [
        { who: "them", text: "엥, 받았네." },
        { who: "them", text: "니 진짜 머함;;;;" },
        { who: "them", text: "다들 너 때문에 난리다, 알고는 있냐?" }
      ] },

    { id: "yurimCall2", at: 140, type: "call", from: "yurim", ring: 18,
      lines: [
        { who: "them", text: "…수현아." },
        { who: "them", text: "화 안 낼게. 그러니까 어디 있는지만 말해줘." },
        { who: "them", text: "나 지금 너네 집 앞이야. 아직 거기 있어." }
      ] },

    { id: "gaenyeomCall2", at: 190, type: "call", from: "gaenyeom", ring: 16,
      retry: { times: 1, every: 15 },
      lines: [
        { who: "them", text: "최수현 대답 안 해도 되니까 잘 들어" },
        { who: "them", text: "위험한 상황은 아닌거지?" },
        { who: "them", text: "아무도 너 의심 안 해" },
        { who: "them", text: "그러니까," },
        { who: "them", text: "내가 아니라도 고유림한테라도 대답 좀 해줘" },
        { who: "them", text: "나 아니여도 괜찮으니까" },
        { who: "them", text: "제발 수현아..." }
      ] },

    { id: "yurimLast", at: 215, type: "message", from: "yurim",
      texts: ["최수현", "제발"] },

    { id: "finalCall", at: "end-50", type: "call", from: "unknown", final: true,
      label: "발신번호 표시제한", ring: 16,
      lines: [
        { who: "them", text: "…받았네." },
        { who: "them", text: "오늘 밤에 잠시 만나." },
        { who: "them", text: "거절 하는 건 아니지?" },
        { who: "them", text: "그러게 왜 의심을 안했어." },
        { who: "them", text: "네가 든 그 봉투안에 뭐가 들었을 줄 알고", cut: true }
      ] }
  ],


  /* ---------- 5. 사진 ---------- */
  photos: [
    { src: "images/photo13.jpg", color: "#d4a5a5", caption: "연근갈비탕", date: "1월 5일", favorite: true },
    { src: "images/photo2.jpg",  color: "#d4a5a5", caption: "", date: "12월 29일" },
    { src: "images/photo3.jpg",  color: "#8fb3c9", caption: "", date: "12월 29일" },
    { src: "images/photo1.jpg",  color: "#9aa5c4", caption: "", date: "12월 25일", favorite: true },
    { src: "images/photo4.jpg",  color: "#c9b79c", caption: "", date: "11월 20일" },
    { src: "images/photo5.jpg",  color: "#7fa896", caption: "", date: "11월 17일" },
    { src: "images/photo6.jpg",  color: "#b497bd", caption: "", date: "11월 17일" },
    { src: "images/photo7.jpg",  color: "#d4a5a5", caption: "", date: "10월 29일" },
    { src: "images/photo9.jpg",  color: "#8fb3c9", caption: "", date: "10월 8일" },
    { src: "images/photo10.jpg", color: "#9aa5c4", caption: "", date: "9월 21일" },
    { src: "images/photo12.jpg", color: "#c9b79c", caption: "", date: "9월 11일" },
    { src: "images/photo8.jpg",  color: "#d4a5a5", caption: "", date: "9월 2일" },
    { src: "images/photo11.jpg", color: "#7fa896", caption: "", date: "8월 28일" },
    { src: "images/photo16.jpg", color: "#8a8a90", caption: "삭제된 사진", date: "10월 20일", deleted: true, daysLeft: 9 }
  ],


  /* ---------- 6. 메모 ---------- */
  notes: [
    { title: "할 일", date: "10월 18일", body: "- 과제 제출\n- 택배 찾기\n- 전화하기" },
    { title: "메모", date: "10월 19일", body: "11시 유락여중 앞 세븐\n11시 20분 온천천 농구대 아래\n11시 37분 중앙여고 옆 CU." },
    { title: "잠긴 메모", date: "10월 20일", lock: "74418", hint: "어머니", body: "케타민 10g\n엑스터시 60정" }
  ],


  /* ---------- 7. 인터넷 ---------- */
  web: {
    bookmarks: [
      { name: "뉴스",   page: "news1" },
      { name: "순찰",   page: "news2" },
      { name: "Q&A",    page: "qa1" },
      { name: "퀴즈",   page: "qa2" }
    ],
    pages: [
      { id: "news1", site: "이웃저널", url: "neighbor-journal.example/news/20108", visited: true,
        title: "학교 주변 ‘익명 신고’ 잇따라…경찰 “사실관계 확인 중”",
        time: "10월 20일 오후 4:12", author: "사회부 기자",
        tags: ["익명 신고", "경찰", "학교", "소문"],
        body: [
          "최근 일부 학교 주변에서 익명 신고가 잇따르면서 경찰이 사실관계 확인에 나섰다.",
          "경찰 관계자는 “접수된 내용이 서로 엇갈려 신고자와 당사자 모두를 대상으로 사실 관계를 확인하는 단계”라며 “확인되지 않은 내용이 퍼지지 않도록 주의해 달라”고 말했다.",
          { img: "#9aa5c4", caption: "(사진은 기사 내용과 직접 관련이 없습니다)" },
          "전문가들은 “익명 신고는 신고자를 보호하기 위한 장치지만, 확인되지 않은 정보가 빠르게 퍼지는 부작용도 있다”며 “당사자의 이야기를 충분히 듣는 절차가 필요하다”고 지적했다.",
          { quote: "소문은 사실이 확인되기 전에 먼저 도착합니다. 그 사이 당사자는 설명할 기회를 잃습니다." }
        ],
        comments: [
          { name: "익명1", text: "저 학교 어디야? 무슨 신고인가 찾아봤는데 심각하던데", time: "4시간 전", likes: 23 },
          { name: "익명2", text: "확인도 안 된 걸 왜 기사로 쓰냐", time: "3시간 전", likes: 41 },
          { name: "익명3", text: "뭔ㅋㅋ 기사에 내용이 없노", time: "1시간 전", likes: 87 }
        ] },

      { id: "news2", site: "이웃저널", url: "neighbor-journal.example/news/19977",
        title: "구청, 야간 학교 주변 합동 순찰 강화…편의점 ‘안전 지킴이’ 확대",
        time: "10월 18일 오전 9:30", author: "지역부 기자",
        tags: ["순찰", "편의점", "귀가", "야간", "안전"],
        body: [
          "구청은 이달부터 야간 시간대 학교 주변 합동 순찰을 강화한다고 밝혔다.",
          "최근 들어오는 신고에 따라, 밤 11시 이후 학생들의 귀가가 늘어나는 구간을 중심으로 순찰 횟수를 늘리고, 인근 편의점 50여 곳을 ‘안전 지킴이’로 지정해 긴급 상황에 대비한다.",
          { h: "주민 의견" },
          "한 주민은 “밤에 아이들이 많이 다니는데 가로등이 어두운 길이 많다”며 “순찰이 늘어난다니 마음이 놓인다”고 말했다."
        ],
        comments: [
          { name: "동네주민", text: "온천천 쪽도 좀 봐주세요. 밤에 너무 어두워요", time: "2일 전", likes: 12 }
        ] },

      { id: "qa1", site: "물어봐요", url: "mulubayo.example/q/88213", visited: true,
        title: "억울하게 일에 휘말렸을 때 어떻게 해야 하나요?",
        time: "9월 30일 오후 10:05", author: "질문자",
        tags: ["억울", "휘말", "도움", "상담"],
        body: [
          "저랑 전혀 관련 없는 일에 휘말려 버렸어요. 언제부터 이렇게 된 지도 모르겠어요. 벗어나고 싶은데 어떻게 해야할 지 모르겠어요. 현실적으로 도움을 요청하긴 어려운 상황입니다."
        ],
        comments: [
          { name: "답변1", text: "먼저 믿을 수 있는 사람들에게 있었던 일을 그대로 말해 보세요. 혼자 끌어안고 있으면 더 힘들어져요.", time: "9월 30일", likes: 56 },
          { name: "답변2", text: "대화 내용과 시간 같은 기록을 지우지 말고 남겨 두세요. 나중에 설명할 때 도움이 됩니다.", time: "9월 30일", likes: 48 },
          { name: "답변3", text: "경찰에 도움을 요청하세요.", time: "10월 1일", likes: 31 }
        ] },

      { id: "qa2", site: "물어봐요", url: "mulubayo.example/q/90117",
        title: "시험 다 찍으면 몇 점 나와요? (5지선다 20문항)",
        time: "10월 21일 오전 10:45", author: "질문자",
        tags: ["시험", "찍기", "점수", "확률"],
        body: [
          "5지선다 20문제를 전부 찍으면 평균 몇 점 나올까요? 문제당 5점입니다."
        ],
        comments: [
          { name: "답변1", text: "찍어서 맞힐 확률이 1/5라서 기댓값은 100점 만점에 20점이에요.", time: "10월 21일", likes: 19 },
          { name: "답변2", text: "근데 0점도 충분히 나옵니다 ㅋㅋ 공부하세요", time: "10월 21일", likes: 33 }
        ] }
    ]
  },

  // 인터넷 앱의 "최근 검색"
  history: [
    { text: "시험 다 찍었을때 몇점", time: "오전 10:45", page: "qa2" },
    { text: "Kit Kat", time: "오후 10:47" },
    { text: "익명 신고", time: "오후 11:20", page: "news1" },
    { text: "Special K", time: "오후 10:05" },
    { text: "홍경", time: "오전 2:13" },
    { text: "11월 쉬는 날", time: "오전 2:12" },
    { text: "여자친구 기념일 선물", time: "오전 2:11" },
    { text: "2주년 선물", time: "오전 2:11" },
    { text: "크리스마스 갈 곳", time: "오전 2:09" }
  ],


  /* ---------- 8. 음악 ---------- */
  music: {
    ambient: true,
    songs: [
      { title: "시들었던 나의 밤들은 또다시 피어나고", artist: "안희수", album: "시들었던 나의 밤들은 또다시 피어나고", color: "#5b6cff", duration: 214,
        lyrics: ["가끔은 원망도 해봤어", "서운한 마음을 말하지 않던 널", "시간을 마시며 버텼어", "", "넌 잘 지내고 있는지", "주황빛 노을을 마주하면 슬퍼", "", "우리 사랑이 시작된 그날이", "너무 아름다웠기에 더 물들은 그리움","아직도 널 벗어날 수 없나 봐","","너에게 게을렀던 날들","후회로 얼룩져 깊게 패인 마음","도저히 나아지지 않는","너를 향한 내 습관들","사진 속의 우릴 바라보면 아파"] },
      { title: "연락이 닿지 않는 곳", artist: "나이트라인", album: "밤의 목록", color: "#ff6b8a", duration: 187,
        lyrics: ["신호음이 길게 이어져", "아무도 받지 않는 밤", "", "메시지는 읽히지 않고", "숫자만 하나 더 늘어나", "", "어디쯤 있니", "어디쯤 있니"] }
    ]
  },


  /* ---------- 9. 캘린더 ---------- */
  calendar: {
    year: 2026, month: 10, today: 21,
    events: [
      { day: 19, time: "오후 11:00", title: "밤 11시 약속", place: "유락여중 앞", note: "메모 참고 (11:20 온천천, 11:37 중앙여고 옆)" },
      { day: 20, time: "오후 6:00",  title: "교실에서 보기", place: "교실", note: "아무도 없을 때" },
      { day: 21, time: "종일",        title: "시험 끝", note: "" },
      { day: 22, time: "오전 12:00", title: "(제목 없음)", note: "내일 밤 12시" },
      { day: 24, time: "종일",        title: "기말 대비 스터디", place: "도서관" }
    ]
  },


  /* ---------- 10. 알람 ---------- */
  alarms: [
    { time: "03:00", label: "일어나", on: true,  repeat: "한 번" },
    { time: "07:10", label: "학교",   on: false, repeat: "평일" },
    { time: "23:30", label: "약속",   on: true,  repeat: "한 번" }
  ],


  /* ---------- 11. 엔딩 ---------- */
  ending: {
    title: "",
    text: "",
    button: "처음부터 다시",
    delay: 7
  }
};