export function Scenery() {
  return (
    <svg
      className="scenery"
      viewBox="0 0 1080 690"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#f4ebd9" />
          <stop offset="1" stopColor="#efe3ca" />
        </linearGradient>
        <linearGradient id="hill" x2="0" y2="1">
          <stop stopColor="#b3c5b7" />
          <stop offset="1" stopColor="#77998c" />
        </linearGradient>
      </defs>
      <path fill="url(#sky)" d="M0 0h1080v690H0z" />
      <circle cx="833" cy="178" r="86" fill="#eed0ab" opacity=".72" />
      <path
        d="M0 371Q112 240 260 325T530 305T817 325T1080 265V690H0"
        fill="#d6dac5"
      />
      <path
        d="M0 446Q111 342 248 416T520 402T820 383T1080 340V690H0"
        fill="#c0ceba"
      />
      <path
        d="M0 521Q148 435 316 478T626 458T1080 405V690H0"
        fill="url(#hill)"
      />
      <path d="M0 620Q168 511 388 560T760 515T1080 539V690H0" fill="#719385" />
      <path d="M0 672Q161 583 398 629T822 591T1080 625V690H0" fill="#4f786b" />
      <path
        d="M970 423Q805 440 799 478T599 519T617 554T374 610T431 690"
        fill="none"
        stroke="#e7dec5"
        strokeWidth="11"
        opacity=".65"
      />
      <g fill="#527567" opacity=".75">
        <path d="m892 472 10-37 11 37h-8v16h-6v-16zm30 5 8-29 9 29h-6v12h-5v-12zM119 539l12-45 13 45h-9v20h-7v-20z" />
      </g>
      <g stroke="#a4b0a2" strokeWidth="2" fill="none">
        <path d="m81 183 8-3 8 3m17-10 7-2 7 2m592-69 9-3 9 3" />
      </g>
    </svg>
  );
}
