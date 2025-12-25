document.addEventListener('DOMContentLoaded', async () => {
    // Fetch configuration from options.json
    // Fetch configuration from options.json
    const response = await fetch('options.json');
    const config = await response.json();

    // Use the first domain as the main URL for redirection
    const mainUrl = config.domains && config.domains.length > 0
        ? `https://${config.domains[0].url}`
        : '#';

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
                countdownEl.textContent = '(' + timer + ')';
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

    // Fetch dynamic status for each domain using issitedown.net API
    const domainPromises = config.domains.map(async (domain) => {
        domain.isUp = null; // Default
        domain.message = null;
        try {
            const apiResponse = await fetch('https://issitedown.net/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: domain.url })
            });
            const apiJson = await apiResponse.json();
            domain.isUp = apiJson.isUp;
            domain.message = apiJson.message;
            domain.responseTime = apiJson.responseTime;
        } catch (error) {
            console.error(`Failed to fetch status for ${domain.url}:`, error);
        }
        return domain;
    });

    await Promise.all(domainPromises);

    // Render domains (preserving original order)
    config.domains.forEach(domain => {
        const li = document.createElement('li');

        // Determine status text and class based on isUp from API
        let statusText = domain.status || 'offline';
        let statusClass = domain.status || 'offline';

        if (domain.isUp !== null) {
            statusText = domain.isUp ? 'online' : 'offline';
            statusClass = domain.isUp ? 'online' : 'offline';
        }

        li.innerHTML = `
            <a href="https://${domain.url}" target="_blank" rel="noopener noreferrer"
               aria-label="${domain.url}">${domain.url}</a>
            <span class="domain-status ${statusClass}">${statusText}</span>
        `;
        urlList.appendChild(li);
    });

    // Populate notice section
    if (config.notice) {
        const noticeContainer = document.createElement('div');
        noticeContainer.className = 'news-container';

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

    // Set up Discord button
    const discordBtn = document.getElementById('discordBtn');
    if (config.discord) {
        discordBtn.href = config.discord;
        discordBtn.target = '_blank';
        discordBtn.rel = 'noopener noreferrer';
    } else {
        discordBtn.style.display = 'none';
    }

    // Toggle downtime message
    const downtimeMsg = document.getElementById('downtime-message');

    // Check if ANY domain is "up".
    // If at least one domain is healthy, treat system as usable (hide downtime message).
    // If ALL are down, show downtime message.
    const hasHealthyDomain = config.domains.some(d => {
        if (d.isUp !== null) {
            return d.isUp === true;
        }
        // Fallback to static status if API failed
        return d.status === 'online';
    });

    if (!hasHealthyDomain) {
        downtimeMsg.style.display = 'block';
    } else {
        downtimeMsg.style.display = 'none';
    }
});