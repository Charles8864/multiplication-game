// 游戏物品数据配置
const ITEM_DATA = {
    // 帽子类 (head)
    'hat_top': { name: '绅士礼帽', cost: 10, slot: 'head', image: 'UI/accessories/hats/hat_top.png', category: 'hat' },
    'hat_crown': { name: '黄金皇冠', cost: 50, slot: 'head', image: 'UI/accessories/hats/hat_crown.png', category: 'hat' },
    'hat_cap': { name: '棒球帽', cost: 15, slot: 'head', image: 'UI/accessories/hats/hat_cap.png', category: 'hat' },

    // 衣服类 (body)
    'clothes_shirt': { name: 'T恤', cost: 20, slot: 'body', image: 'UI/accessories/clothes/clothes_shirt.png', category: 'clothes' },
    'clothes_dress': { name: '连衣裙', cost: 30, slot: 'body', image: 'UI/accessories/clothes/clothes_dress.png', category: 'clothes' },
    'clothes_coat': { name: '外套', cost: 40, slot: 'body', image: 'UI/accessories/clothes/clothes_coat.png', category: 'clothes' },

    // 眼镜类 (eyes)
    'glasses_cool': { name: '酷炫眼镜', cost: 15, slot: 'eyes', image: 'UI/accessories/glasses/glasses_cool.png', category: 'glasses' },
    'glasses_sun': { name: '墨镜', cost: 25, slot: 'eyes', image: 'UI/accessories/glasses/glasses_sun.png', category: 'glasses' },
    'glasses_red': { name: '红框眼镜', cost: 20, slot: 'eyes', image: 'UI/accessories/glasses/glasses_red.png', category: 'glasses' },

    // 挂件类 (neck) - 主要是围巾、项链等
    'acc_scarf': { name: '温暖围巾', cost: 20, slot: 'neck', image: 'UI/accessories/accessories/acc_scarf.png', category: 'accessory' },
    'acc_bow': { name: '蝴蝶结', cost: 30, slot: 'neck', image: 'UI/accessories/accessories/acc_bow.png', category: 'accessory' },
    'acc_necklace': { name: '珍珠项链', cost: 45, slot: 'neck', image: 'UI/accessories/accessories/acc_necklace.png', category: 'accessory' },

    // 武器类 (hand)
    'weapon_sword': { name: '宝剑', cost: 35, slot: 'hand', image: 'UI/accessories/weapons/weapon_sword.png', category: 'weapon' },
    'weapon_wand': { name: '魔杖', cost: 45, slot: 'hand', image: 'UI/accessories/weapons/weapon_wand.png', category: 'weapon' },
    'weapon_shield': { name: '盾牌', cost: 30, slot: 'hand', image: 'UI/accessories/weapons/weapon_shield.png', category: 'weapon' },

    // 鞋子类 (feet)
    'shoes_sneakers': { name: '运动鞋', cost: 25, slot: 'feet', image: 'UI/accessories/shoes/shoes_sneakers.png', category: 'shoes' },
    'shoes_boots': { name: '长筒靴', cost: 35, slot: 'feet', image: 'UI/accessories/shoes/shoes_boots.png', category: 'shoes' },
    'shoes_heels': { name: '高跟鞋', cost: 30, slot: 'feet', image: 'UI/accessories/shoes/shoes_heels.png', category: 'shoes' }
};

const CATEGORIES = {
    'hat': '帽子',
    'glasses': '眼镜',
    'clothes': '衣服',
    'accessory': '挂件',
    'weapon': '武器',
    'shoes': '鞋子'
};

// 测试模式开关
const IS_TEST_MODE = false; // 设置为 true 开启测试模式（初始积分 10000），false 关闭

// 游戏状态管理
class MultiplicationGame {
    constructor() {
        this.score = IS_TEST_MODE ? 10000 : 0;
        this.level = 1;
        this.maxLevel = 7;
        this.correctCount = 0;
        this.totalQuestions = 10;
        this.timeLimit = 90;
        this.timeLeft = this.timeLimit;
        this.hasMadeMistake = false;
        this.timer = null;
        this.isPlaying = false;
        this.currentQuestion = null;
        this.recentQuestions = []; // Store last 3 questions
        this.ownedItems = []; // 已拥有的物品
        this.equippedItems = {}; // 当前装备的物品 { slot: itemKey }
        
        this.initializeGame();
    }

    // 初始化游戏
    initializeGame() {
        this.bindEvents();
        this.updateDisplay();
    }

    // 绑定事件
    bindEvents() {
        // 开始游戏按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // 换装商店按钮
        document.getElementById('dressUpBtn').addEventListener('click', () => {
            this.openDressUpShop();
        });

        // 选项按钮
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', (e) => {
                if (this.isPlaying) {
                    this.checkAnswer(parseInt(e.target.dataset.value));
                }
            });
        });

        // 关闭模态框
        document.querySelector('.close').addEventListener('click', () => {
            this.closeDressUpShop();
        });

        // 点击模态框外部关闭
        document.getElementById('dressUpModal').addEventListener('click', (e) => {
            if (e.target.id === 'dressUpModal') {
                this.closeDressUpShop();
            }
        });

        // 购买/装备按钮
        // 注意：这里使用事件委托或者在生成列表时绑定，目前HTML是静态的，但后续可能会动态生成
        // 为了支持动态添加的物品，建议修改为动态绑定，或者在openDressUpShop时重新绑定
        // 这里暂时保持原样，但逻辑修改为 handleShopAction
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shopItem = e.target.closest('.shop-item');
                const item = shopItem.dataset.item;
                const cost = parseInt(shopItem.dataset.cost);
                this.handleShopAction(item, cost);
            });
        });
    }

    // 开始游戏
    startGame() {
        this.isPlaying = true;
        this.correctCount = 0;
        this.hasMadeMistake = false;
        
        // Calculate time limit based on level: 90s -> 30s
        // Level 1: 90, 2: 80, 3: 70, 4: 60, 5: 50, 6: 40, 7: 30
        const levelIndex = Math.min(this.level, this.maxLevel) - 1;
        this.timeLimit = 90 - (levelIndex * 10);
        
        this.timeLeft = this.timeLimit;
        this.updateDisplay();
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('startBtn').textContent = '游戏中...';
        
        this.generateQuestion();
        this.startTimer();
    }

    // 生成题目
    generateQuestion() {
        let num1, num2, questionKey;
        
        // Generate unique question not in recent history
        do {
            num1 = Math.floor(Math.random() * 9) + 1; // 1-9
            num2 = Math.floor(Math.random() * 9) + 1; // 1-9
            questionKey = `${Math.min(num1, num2)}x${Math.max(num1, num2)}`;
        } while (this.recentQuestions.includes(questionKey));

        // Update history
        this.recentQuestions.push(questionKey);
        if (this.recentQuestions.length > 3) {
            this.recentQuestions.shift();
        }

        const correctAnswer = num1 * num2;
        this.currentQuestion = { num1, num2, correctAnswer };
        
        // 显示题目
        document.getElementById('question').textContent = `${num1} × ${num2} = ?`;
        
        // 生成选项（1个正确答案，3个错误答案）
        const options = this.generateOptions(correctAnswer);
        this.displayOptions(options);
    }

    // 生成选项
    generateOptions(correctAnswer) {
        const options = new Set([correctAnswer]);
        
        // Valid products for 1-9 multiplication table
        const validProducts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20,
                              21, 24, 25, 27, 28, 30, 32, 35, 36, 40, 42, 45, 48, 49,
                              54, 56, 63, 64, 72, 81];
        
        while (options.size < 4) {
            // Randomly select from valid products
            const randomIndex = Math.floor(Math.random() * validProducts.length);
            const wrongAnswer = validProducts[randomIndex];
            
            // Add if not already present (Set handles duplicates automatically)
            options.add(wrongAnswer);
        }
        
        return Array.from(options).sort(() => Math.random() - 0.5);
    }

    // 显示选项
    displayOptions(options) {
        const optionsContainer = document.getElementById('options');
        optionsContainer.innerHTML = '';
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option';
            button.textContent = option;
            button.dataset.value = option;
            button.addEventListener('click', (e) => {
                if (this.isPlaying) {
                    this.checkAnswer(parseInt(e.target.dataset.value));
                }
            });
            optionsContainer.appendChild(button);
        });
    }

    // 检查答案
    checkAnswer(selectedAnswer) {
        console.log(`Checking answer: Selected ${selectedAnswer}, Correct ${this.currentQuestion.correctAnswer}`);
        const options = document.querySelectorAll('.option');
        const correctAnswer = this.currentQuestion.correctAnswer;
        
        options.forEach(option => {
            option.disabled = true;
            const value = parseInt(option.dataset.value);
            
            if (value === correctAnswer) {
                option.classList.add('correct');
            } else if (value === selectedAnswer) {
                option.classList.add('wrong');
            }
        });

        if (selectedAnswer === correctAnswer) {
            this.correctCount++;
            console.log(`Answer Correct! Progress: ${this.correctCount}/${this.totalQuestions}`);
            this.showMessage('回答正确！👍', 'success');
        } else {
            console.log('Answer Wrong!');
            this.hasMadeMistake = true;
            this.showMessage(`回答错误！正确答案是 ${correctAnswer}`, 'error');
            
            // 立即结束游戏
            setTimeout(() => {
                this.endGame(false);
            }, 1500);
            return;
        }

        this.updateDisplay();

        // 延迟后生成下一题或结束游戏
        setTimeout(() => {
            if (this.correctCount >= this.totalQuestions) {
                this.endGame(true);
            } else {
                this.generateQuestion();
                this.enableOptions();
            }
        }, 500);
    }

    // 启用选项按钮
    enableOptions() {
        document.querySelectorAll('.option').forEach(option => {
            option.disabled = false;
            option.classList.remove('correct', 'wrong');
        });
    }

    // 开始计时器
    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timer').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame(false);
            }
            
            // 时间警告
            if (this.timeLeft <= 10) {
                document.getElementById('timer').style.color = '#dc3545';
                document.getElementById('timer').style.fontWeight = 'bold';
            }
        }, 1000);
    }

    // 结束游戏
    endGame(isSuccess) {
        this.isPlaying = false;
        clearInterval(this.timer);
        
        document.getElementById('startBtn').disabled = false;
        
        if (isSuccess) {
            if (!this.hasMadeMistake) {
                this.addScore(80);
                this.showMessage(`完美通关！全部答对，获得 80 积分奖励！`, 'success');
            } else {
                this.showMessage(`关卡完成！可惜有错误，无法获得积分。`, 'info');
            }
            
            if (this.level < this.maxLevel) {
                this.level++;
                document.getElementById('startBtn').textContent = '继续闯关';
            } else {
                this.showMessage('恭喜通关所有关卡！', 'success');
                document.getElementById('startBtn').textContent = '恭喜通关';
                // Reset level to 1 if they want to play again? Or keep at max?
                // Let's reset to 1 for replayability after full completion
                this.level = 1;
                setTimeout(() => {
                     document.getElementById('startBtn').textContent = '重新开始';
                }, 2000);
            }
        } else {
            document.getElementById('startBtn').textContent = '重新开始';
            if (this.hasMadeMistake) {
                this.showMessage('回答错误，挑战失败！请重新开始。', 'error');
            } else {
                this.showMessage('时间到！游戏结束！', 'error');
            }
        }
        
        this.updateDisplay();
    }

    // 添加积分
    addScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
        
        // 积分动画效果
        const scoreElement = document.getElementById('score');
        scoreElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
        }, 300);
    }

    // 显示消息
    showMessage(message, type) {
        // 移除现有消息
        const existingMessage = document.querySelector('.game-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `game-message message-${type}`;
        messageDiv.textContent = message;
        
        document.querySelector('.question-area').appendChild(messageDiv);
        
        // 3秒后自动移除消息
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    // 打开换装商店
    openDressUpShop() {
        document.getElementById('dressUpModal').style.display = 'block';
        this.renderShopItems(); // 动态渲染商店物品
        this.updateShopButtons();
    }

    // 渲染商店物品
    renderShopItems() {
        const shopContainer = document.querySelector('.shop-items');
        shopContainer.innerHTML = ''; // 清空现有内容

        // 按分类分组
        const itemsByCategory = {};
        Object.entries(ITEM_DATA).forEach(([key, item]) => {
            if (!itemsByCategory[item.category]) {
                itemsByCategory[item.category] = [];
            }
            itemsByCategory[item.category].push({ key, ...item });
        });

        // 遍历分类渲染
        Object.entries(CATEGORIES).forEach(([catKey, catName]) => {
            // 创建分类标题
            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'shop-category-title';
            categoryTitle.textContent = catName;
            shopContainer.appendChild(categoryTitle);

            // 创建该分类下的物品容器
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'shop-category-items';

            const items = itemsByCategory[catKey] || [];
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'shop-item';
                itemDiv.dataset.item = item.key;
                itemDiv.dataset.cost = item.cost;

                itemDiv.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="item-icon">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-price">${item.cost}积分</div>
                    </div>
                    <button class="buy-btn">购买</button>
                `;
                
                // 绑定点击事件
                itemDiv.querySelector('.buy-btn').addEventListener('click', () => {
                    this.handleShopAction(item.key, item.cost);
                });

                categoryContainer.appendChild(itemDiv);
            });

            shopContainer.appendChild(categoryContainer);
        });
    }

    // 关闭换装商店
    closeDressUpShop() {
        document.getElementById('dressUpModal').style.display = 'none';
    }

    // 更新商店按钮状态
    updateShopButtons() {
        document.querySelectorAll('.shop-item').forEach(itemElem => {
            const itemKey = itemElem.dataset.item;
            const cost = parseInt(itemElem.dataset.cost);
            const buyBtn = itemElem.querySelector('.buy-btn');
            const itemData = ITEM_DATA[itemKey];
            
            if (!this.ownedItems.includes(itemKey)) {
                // 尚未购买
                buyBtn.textContent = `购买 (${cost})`;
                buyBtn.classList.remove('btn-equip', 'btn-unequip');
                if (this.score < cost) {
                    buyBtn.disabled = true;
                    buyBtn.textContent = '积分不足';
                } else {
                    buyBtn.disabled = false;
                }
            } else {
                // 已购买
                buyBtn.disabled = false;
                const isEquipped = this.equippedItems[itemData.slot] === itemKey;
                
                if (isEquipped) {
                    buyBtn.textContent = '脱下';
                    buyBtn.classList.add('btn-unequip');
                    buyBtn.classList.remove('btn-equip');
                } else {
                    buyBtn.textContent = '穿戴';
                    buyBtn.classList.add('btn-equip');
                    buyBtn.classList.remove('btn-unequip');
                }
            }
        });
    }

    // 处理商店操作（购买/穿戴/脱下）
    handleShopAction(itemKey, cost) {
        const itemData = ITEM_DATA[itemKey];
        if (!itemData) return;

        if (!this.ownedItems.includes(itemKey)) {
            // 购买逻辑
            if (this.score >= cost) {
                this.score -= cost;
                this.ownedItems.push(itemKey);
                this.updateDisplay();
                this.showMessage(`成功购买 ${itemData.name}！`, 'success');
                // 购买后自动穿戴
                this.equipItem(itemKey);
            }
        } else {
            // 穿戴/脱下逻辑
            const isEquipped = this.equippedItems[itemData.slot] === itemKey;
            if (isEquipped) {
                this.unequipItem(itemData.slot);
            } else {
                this.equipItem(itemKey);
            }
        }
        this.updateShopButtons();
    }

    // 穿戴物品
    equipItem(itemKey) {
        const itemData = ITEM_DATA[itemKey];
        if (!itemData) return;

        this.equippedItems[itemData.slot] = itemKey;
        this.updateChickenAppearance();
        this.updateShopButtons();
    }

    // 脱下物品
    unequipItem(slot) {
        if (this.equippedItems[slot]) {
            delete this.equippedItems[slot];
            this.updateChickenAppearance();
            this.updateShopButtons();
        }
    }

    // 获取物品名称
    getItemName(item) {
        return ITEM_DATA[item] ? ITEM_DATA[item].name : item;
    }

    // 更新小鸡外观
    updateChickenAppearance() {
        const accessoriesDiv = document.querySelector('.chicken-accessories');
        accessoriesDiv.innerHTML = '';
        
        Object.entries(this.equippedItems).forEach(([slot, itemKey]) => {
            if (itemKey) {
                const itemData = ITEM_DATA[itemKey];
                const accessory = document.createElement('div');
                accessory.className = `accessory slot-${slot} item-${itemKey}`;
                
                // 特殊处理脚部物品（鞋子），需要显示两只
                if (slot === 'feet') {
                    const leftShoe = document.createElement('img');
                    leftShoe.className = 'shoe-left';
                    leftShoe.src = itemData.image;
                    leftShoe.alt = itemData.name;
                    
                    const rightShoe = document.createElement('img');
                    rightShoe.className = 'shoe-right';
                    rightShoe.src = itemData.image;
                    rightShoe.alt = itemData.name;
                    
                    accessory.appendChild(leftShoe);
                    accessory.appendChild(rightShoe);
                } else {
                    const img = document.createElement('img');
                    img.src = itemData.image;
                    img.alt = itemData.name;
                    accessory.appendChild(img);
                }
                
                accessoriesDiv.appendChild(accessory);
            }
        });
    }

    // 获取配件图片路径
    getAccessoryImage(item) {
        return ITEM_DATA[item] ? ITEM_DATA[item].image : '';
    }

    // 更新显示
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('correctCount').textContent = this.correctCount;
        document.getElementById('timer').textContent = this.timeLeft;
        
        // 重置计时器颜色
        if (this.timeLeft > 10) {
            document.getElementById('timer').style.color = '';
            document.getElementById('timer').style.fontWeight = '';
        }
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MultiplicationGame();
});

// 移动端触摸优化
document.addEventListener('touchstart', function() {}, {passive: true});

// 防止双击缩放
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);