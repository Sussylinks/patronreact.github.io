document.addEventListener('DOMContentLoaded', async () => {
    // Fetch configuration from options.json
    const response = await fetch('options.json');
    const config = await response.json();
    const mainUrl = `https://${config.main}`;

    // Get elements from the DOM
    const visitBtn = document.getElementById('cancelBtn');
    const urlList = document.querySelector('.url-list ul');
    const newsSection = document.querySelector('.news-section');

    // Handle redirection
    if (config.redirection) {
        if (config.redirectionTimer > 0) {
            let timer = config.redirectionTimer;
            const countdownEl = document.getElementById('countdown');
            
            countdownEl.style.display = 'inline-block';
            const interval = setInterval(() => {
                timer--;
                countdownEl.textContent = '('+timer+')';
                if (timer <= 0) {
                    clearInterval(interval);
                    window.location.href = mainUrl;
                }
            }, 1000);
        } else {
            window.location.href = mainUrl;
        }
    }

    // Clear existing links
    urlList.innerHTML = '';

    // Sort domains by status (online first) and populate list
    const sortedDomains = config.domains.sort((a, b) => {
        if (a.status === 'online' && b.status === 'offline') return -1;
        if (a.status === 'offline' && b.status === 'online') return 1;
        return 0;
    });

    sortedDomains.forEach(domain => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="https://${domain.url}" target="_blank" rel="noopener noreferrer"
               aria-label="${domain.url}">${domain.url}</a>
            <span class="domain-status ${domain.status}">${domain.status}</span>
        `;
        urlList.appendChild(li);
    });

    // Populate notice section
    if (config.notice) {
        const noticeContainer = document.createElement('div');
        noticeContainer.className = 'news-container'; // Reusing class for styling
        
        const noticeItem = document.createElement('div');
        noticeItem.className = 'news-item';
        const date = new Date(config.notice.date).toLocaleDateString();
        noticeItem.innerHTML = `
            <h3>${config.notice.title}</h3>
            <p>${config.notice.content}</p>
            <span class="news-date">${date}</span>
        `;
        noticeContainer.appendChild(noticeItem);
        
        newsSection.appendChild(noticeContainer);
    }

    // Set up visit button
    visitBtn.href = mainUrl;
});