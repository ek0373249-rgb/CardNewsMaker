document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const coverTitleInput = document.getElementById('cover-title');
    const coverSubtitleInput = document.getElementById('cover-subtitle');
    const coverBgUpload = document.getElementById('cover-bg-upload');
    const coverBgOpacityInput = document.getElementById('cover-bg-opacity');
    const opacityValSpan = document.getElementById('opacity-val');
    const coverGradEnable = document.getElementById('cover-grad-enable');
    const coverGradColor = document.getElementById('cover-grad-color');
    const coverGradDir = document.getElementById('cover-grad-dir');
    const coverTextAlign = document.getElementById('cover-text-align');

    const bodyContentInput = document.getElementById('body-content');
    const outroTextInput = document.getElementById('outro-text');
    const logoUpload = document.getElementById('logo-upload');
    
    const bgColorPicker = document.getElementById('bg-color');
    const textColorPicker = document.getElementById('text-color');
    const primaryColorPicker = document.getElementById('primary-color');
    
    const cardsContainer = document.getElementById('cards-container');
    const btnDownloadAll = document.getElementById('btn-download-all');

    // State
    let coverBgUrl = '';
    let logoUrl = '';

    // Events
    function attachEventListeners() {
        const inputs = [
            coverTitleInput, coverSubtitleInput, bodyContentInput, outroTextInput,
            bgColorPicker, textColorPicker, primaryColorPicker, coverGradColor
        ];
        inputs.forEach(input => input.addEventListener('input', renderCards));
        
        const changes = [coverGradEnable, coverGradDir, coverTextAlign];
        changes.forEach(select => select.addEventListener('change', renderCards));

        coverBgOpacityInput.addEventListener('input', (e) => {
            opacityValSpan.textContent = Math.round(e.target.value * 100);
            renderCards();
        });

        coverBgUpload.addEventListener('change', (e) => handleImageUpload(e, (url) => {
            coverBgUrl = url;
            renderCards();
        }));

        logoUpload.addEventListener('change', (e) => handleImageUpload(e, (url) => {
            logoUrl = url;
            renderCards();
        }));

        btnDownloadAll.addEventListener('click', downloadAllCards);
    }

    function handleImageUpload(event, callback) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => callback(e.target.result);
            reader.readAsDataURL(file);
        }
    }

    function parseBodyContent() {
        const rawContent = bodyContentInput.value;
        const pages = rawContent.split(/\n\s*\n|---/);
        return pages.map(p => p.trim()).filter(p => p.length > 0);
    }

    function renderCards() {
        if (!cardsContainer) return;
        cardsContainer.innerHTML = ''; 

        const bgColor = bgColorPicker.value;
        const textColor = textColorPicker.value;
        const primaryColor = primaryColorPicker.value;
        const globalStyles = `background-color: ${bgColor}; color: ${textColor};`;

        // Cover styling configurations
        const hexToRgb = (hex) => {
            const bigint = parseInt(hex.replace('#',''), 16);
            return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
        };

        const bgOpacity = coverBgOpacityInput.value;
        const enableGrad = coverGradEnable.checked;
        const gradRgb = hexToRgb(coverGradColor.value);
        const gradDir = coverGradDir.value;
        
        let gradStyle = '';
        if (enableGrad) {
            if (gradDir === 'circle') {
                gradStyle = `background: radial-gradient(circle, rgba(${gradRgb}, 0.8) 0%, rgba(${gradRgb}, 0) 70%);`;
            } else {
                gradStyle = `background: linear-gradient(${gradDir}, rgba(${gradRgb}, 0.85) 0%, rgba(${gradRgb}, 0) 60%);`;
            }
        }

        const alignOpt = coverTextAlign.value;
        let cJustify = 'center', cAlign = 'center', cText = 'center';
        if (alignOpt === 'flex-end-left') {
            cJustify = 'flex-end'; cAlign = 'flex-start'; cText = 'left';
        } else if (alignOpt === 'flex-start-left') {
            cJustify = 'flex-start'; cAlign = 'flex-start'; cText = 'left';
        }

        // 1. Cover
        const subtitleText = coverSubtitleInput.value;
        const coverHtml = `
            ${coverBgUrl ? `<div class="card-bg-layer" style="background-image: url('${coverBgUrl}'); opacity: ${bgOpacity};"></div>` : ''}
            ${enableGrad ? `<div class="card-grad-layer" style="${gradStyle}"></div>` : ''}
            <div class="card-inner" style="justify-content: ${cJustify}; align-items: ${cAlign}; text-align: ${cText};">
                <div class="cover-title-text" style="color: ${primaryColor};">${escapeHtml(coverTitleInput.value)}</div>
                ${subtitleText ? `<div class="cover-subtitle-text" style="color: ${primaryColor}; opacity: 0.9;">${escapeHtml(subtitleText)}</div>` : ''}
            </div>
        `;
        createCardElement(coverHtml, globalStyles, 'page-cover', '01_표지.png');

        // 2. Body Pages
        const bodyPages = parseBodyContent();
        bodyPages.forEach((text, index) => {
            const pageNum = index + 2;
            const bodyHtml = `
                <div class="card-inner">
                    <div class="body-text">${escapeHtml(text)}</div>
                    <div class="page-number" style="color: ${primaryColor}">${pageNum}</div>
                </div>
            `;
            const indexStr = pageNum.toString().padStart(2, '0');
            createCardElement(bodyHtml, globalStyles, 'page-body', `${indexStr}_본문.png`);
        });

        // 3. Outro Page
        const outroNum = bodyPages.length + 2;
        const outroHtml = `
            ${coverBgUrl ? `<div class="card-bg-layer" style="background-image: url('${coverBgUrl}'); opacity: 0.5; transform: scale(1.5);"></div>` : ''}
            <div class="card-grad-layer" style="background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%);"></div>
            <div class="card-inner">
                <div class="outro-text">${escapeHtml(outroTextInput.value)}</div>
                ${logoUrl ? `<img src="${logoUrl}" class="outro-logo" alt="Logo">` : ''}
                <div class="page-number" style="color: ${primaryColor}">${outroNum}</div>
            </div>
        `;
        const outroStr = outroNum.toString().padStart(2, '0');
        createCardElement(outroHtml, globalStyles, 'page-outro', `${outroStr}_아웃트로.png`);
    }

    function createCardElement(innerHTML, styles, className, fileName) {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-wrapper';

        const canvas = document.createElement('div');
        canvas.className = `card-canvas ${className}`;
        canvas.style = styles;
        canvas.innerHTML = innerHTML;
        canvas.setAttribute('data-filename', fileName);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn secondary';
        downloadBtn.style.width = '200px';
        downloadBtn.style.marginTop = '20px';
        downloadBtn.textContent = '📥 개별 다운로드';
        downloadBtn.onclick = () => downloadSingleCard(canvas, fileName);

        wrapper.appendChild(canvas);
        wrapper.appendChild(downloadBtn);
        cardsContainer.appendChild(wrapper);
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br>");
    }

    async function downloadSingleCard(cardElement, filename) {
        try {
            const canvas = await html2canvas(cardElement, {
                scale: 1, 
                useCORS: true,
                backgroundColor: bgColorPicker.value
            });
            canvas.toBlob(blob => {
                if (window.saveAs) {
                    window.saveAs(blob, filename);
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }, 'image/png');
        } catch (err) {
            console.error('다운로드 오류:', err);
            alert('이미지 생성 중 오류가 발생했습니다.');
        }
    }

    async function downloadAllCards() {
        btnDownloadAll.innerHTML = '⏳ 다운로드 중... 잠시만 기다려주세요';
        btnDownloadAll.disabled = true;

        try {
            const cards = document.querySelectorAll('.card-canvas');
            
            for (let i = 0; i < cards.length; i++) {
                const canvas = await html2canvas(cards[i], {
                    scale: 1,
                    useCORS: true,
                    backgroundColor: bgColorPicker.value
                });
                
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const fileName = cards[i].getAttribute('data-filename') || `card_${i+1}.png`;
                
                if (window.saveAs) {
                    window.saveAs(blob, fileName);
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                
                // 약간의 지연 시간을 주어 브라우저의 다중 다운로드 차단을 방지
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (err) {
            console.error('일괄 다운로드 오류:', err);
            alert('다운로드 중 오류가 발생했습니다.');
        } finally {
            btnDownloadAll.innerHTML = '전체 일괄 다운로드';
            btnDownloadAll.disabled = false;
        }
    }

    // Start
    attachEventListeners();
    setTimeout(renderCards, 100);
});
