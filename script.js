// 在文件开头添加这些全局变量
let audioPlayer;
let songInfo;
let currentSong = null;
let isMinimized = false;

document.addEventListener('DOMContentLoaded', function() {
    const hotTabs = document.getElementById('hotTabs');
    const hotList = document.getElementById('hotList');
    const background = document.getElementById('background');
    const updateTimeElement = document.getElementById('updateTime');
    const randomVideoElement = document.getElementById('randomVideo');

    // 随机背景图片
    const backgroundImages = [
        'https://source.unsplash.com/random/1920x1080?nature',
        'https://source.unsplash.com/random/1920x1080?landscape',
        'https://source.unsplash.com/random/1920x1080?city',
        'https://source.unsplash.com/random/1920x1080?abstract',
        'https://source.unsplash.com/random/1920x1080?technology'
    ];

    function setRandomBackground() {
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        background.style.backgroundImage = `url('${backgroundImages[randomIndex]}')`;
    }

    setRandomBackground();

    hotTabs.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-button')) {
            const buttons = hotTabs.getElementsByClassName('tab-button');
            for (let button of buttons) {
                button.classList.remove('active');
            }
            e.target.classList.add('active');
            fetchHotList(e.target.dataset.type);
        }
    });

    // 获取随机微视视频
    function fetchRandomVideo() {
        //fetch('https://api.lolimi.cn/API/weishi/api.php')//api
            .then(response => response.json())
            .then(data => {
                if (data.code === '1') {
                    const videoHtml = `
                        <video controls>
                            <source src="${data.data.url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <p>作者: ${data.data.author}</p>
                    `;
                    randomVideoElement.innerHTML = videoHtml;
                } else {
                    randomVideoElement.innerHTML = '<p>无法加载视频</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                randomVideoElement.innerHTML = '<p>加载视频时发生错误</p>';
            });
    }

    function fetchHotList(type) {
        //const url = `https://api.lolimi.cn/API/jhrb/?hot=${encodeURIComponent(type)}`;//api

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    displayHotList(data);
                    fetchRandomVideo(); // 每次加载热榜时也刷新随机视频
                } else {
                    hotList.innerHTML = '<p>获取数据失败,请稍后再试。</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                hotList.innerHTML = '<p>发生错误,请稍后再试。</p>';
            });
    }

    function displayHotList(data) {
        hotList.innerHTML = '';
        console.log('接收到的数据:', data);

        updateTimeElement.textContent = `更新时间: ${data.updateTime || '未知'}`;

        data.data.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'hot-item';
            
            const imgUrl = item.face || item.pic;
            const imgHtml = imgUrl && imgUrl.trim() !== '' ? 
                `<img src="${imgUrl}" alt="${item.title}" onerror="this.style.display='none'">` : 
                '<p>无图片</p>';
            
            itemElement.innerHTML = `
                <h2>${item.title}</h2>
                ${imgHtml}
                <p>热度: ${item.hot || '未知'}</p>
                <a href="${item.url}" target="_blank">查看详情</a>
            `;
            hotList.appendChild(itemElement);
        });
    }

    // 添加音乐播放器功能
    const musicPlayer = document.querySelector('.music-player');
    const songSearch = document.getElementById('songSearch');
    const searchButton = document.getElementById('searchButton');
    audioPlayer = document.getElementById('audioPlayer');
    songInfo = document.getElementById('songInfo');

    searchButton.addEventListener('click', searchSong);

    function searchSong() {
        const songName = songSearch.value;
        if (songName.trim() === '') {
            alert('请输入歌曲名');
            return;
        }

        // 清除之前的搜索结果
        const oldSongList = document.querySelector('.song-list');
        if (oldSongList) {
            oldSongList.remove();
        }

        const songListContainer = document.createElement('div');
        songListContainer.className = 'song-list';
        document.querySelector('.music-player').appendChild(songListContainer);

        // 获取从n=1到n=10的所有歌曲
        for (let n = 1; n <= 10; n++) {
            //const url = `https://api.lolimi.cn/API/wydg/api.php?msg=${encodeURIComponent(songName)}&n=${n}`;//api

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        addSongToList(data, n);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    }

    function addSongToList(song, index) {
        const songListContainer = document.querySelector('.song-list');
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.innerHTML = `
            <p>${index}. ${song.name} - ${song.author}</p>
            <button class="play-button" data-url="${song.mp3}">选择</button>
        `;
        songListContainer.appendChild(songElement);

        songElement.querySelector('.play-button').addEventListener('click', function() {
            playSong(song, this.dataset.url);
        });
    }

    function playSong(song, url) {
        if (!audioPlayer) {
            audioPlayer = new Audio();
        }
        
        audioPlayer.src = url;
        audioPlayer.play()
            .then(() => {
                console.log('开始播放');
                currentSong = { url: url, name: song.name, author: song.author };
                updateSongInfo();
                updatePlayPauseButton();
                if (!isMinimized) {
                    minimizePlayer();
                }
            })
            .catch(error => {
                console.error('播放失败:', error);
                alert('播放失败，请重试');
            });
    }

    function togglePlayPause() {
        if (audioPlayer) {
            if (audioPlayer.paused) {
                audioPlayer.play();
            } else {
                audioPlayer.pause();
            }
            updatePlayPauseButton();
        }
    }

    function updateSongInfo() {
        if (songInfo && currentSong) {
            songInfo.textContent = `正在播放: ${currentSong.name} - ${currentSong.author}`;
        }
    }

    function updatePlayPauseButton() {
        const pausePlayButton = document.getElementById('pausePlayButton');
        if (pausePlayButton && audioPlayer) {
            pausePlayButton.textContent = audioPlayer.paused ? '播放' : '暂停';
        }
    }

    function minimizePlayer() {
        const musicPlayer = document.querySelector('.music-player');
        musicPlayer.classList.add('minimized');
        musicPlayer.innerHTML = `
            <button id="expandButton">展开</button>
            <button id="pausePlayButton">${audioPlayer && !audioPlayer.paused ? '暂停' : '播放'}</button>
        `;
        isMinimized = true;

        document.getElementById('expandButton').addEventListener('click', expandPlayer);
        document.getElementById('pausePlayButton').addEventListener('click', togglePlayPause);
    }

    function expandPlayer() {
        if (isMinimized) {
            const musicPlayer = document.querySelector('.music-player');
            musicPlayer.classList.remove('minimized');
            
            const wasPlaying = audioPlayer && !audioPlayer.paused;
            const currentTime = audioPlayer ? audioPlayer.currentTime : 0;
            
            musicPlayer.innerHTML = `
                <div class="player-controls">
                    <input type="text" id="songSearch" placeholder="输入歌曲名">
                    <button id="searchButton">搜索</button>
                    <button id="minimizeButton">收起</button>
                </div>
                <audio id="audioPlayer" controls></audio>
                <p id="songInfo"></p>
            `;
            isMinimized = false;

            document.getElementById('searchButton').addEventListener('click', searchSong);
            document.getElementById('minimizeButton').addEventListener('click', minimizePlayer);
            audioPlayer = document.getElementById('audioPlayer');
            songInfo = document.getElementById('songInfo');

            if (currentSong) {
                audioPlayer.src = currentSong.url;
                audioPlayer.currentTime = currentTime;
                updateSongInfo();
                if (wasPlaying) {
                    audioPlayer.play().catch(e => console.error('播放失败:', e));
                }
            }

            // 恢复之前的搜索结果
            const oldSongList = document.querySelector('.song-list');
            if (oldSongList) {
                musicPlayer.appendChild(oldSongList);
            }

            // 重新添加事件监听器
            audioPlayer.addEventListener('play', updatePlayPauseButton);
            audioPlayer.addEventListener('pause', updatePlayPauseButton);
        }
    }

    // 初始加载哔哩哔哩热榜和随机视频
    fetchHotList('哔哩哔哩');

    if (audioPlayer) {
        audioPlayer.addEventListener('play', updatePlayPauseButton);
        audioPlayer.addEventListener('pause', updatePlayPauseButton);
    }
});
