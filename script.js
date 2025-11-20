// 游戏状态管理
class MultiplicationGame {
    constructor() {
        this.score = 0;
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
        this.equippedItems = [];
        
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

        // 购买按钮
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shopItem = e.target.closest('.shop-item');
                const item = shopItem.dataset.item;
                const cost = parseInt(shopItem.dataset.cost);
                this.buyItem(item, cost, shopItem);
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
            num1 = Math.floor(Math.random() * 4) + 2; // 2-5
            num2 = Math.floor(Math.random() * 4) + 2; // 2-5
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
        
        // Valid products for 2-5 multiplication table
        const validProducts = [4, 6, 8, 9, 10, 12, 15, 16, 20, 25];
        
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
                this.addScore(10);
                this.showMessage(`完美通关！全部答对，获得 10 积分奖励！`, 'success');
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
        this.updateShopButtons();
    }

    // 关闭换装商店
    closeDressUpShop() {
        document.getElementById('dressUpModal').style.display = 'none';
    }

    // 更新商店按钮状态
    updateShopButtons() {
        document.querySelectorAll('.shop-item').forEach(item => {
            const itemType = item.dataset.item;
            const cost = parseInt(item.dataset.cost);
            const buyBtn = item.querySelector('.buy-btn');
            
            if (this.equippedItems.includes(itemType)) {
                buyBtn.textContent = '已装备';
                buyBtn.disabled = true;
            } else if (this.score < cost) {
                buyBtn.textContent = '积分不足';
                buyBtn.disabled = true;
            } else {
                buyBtn.textContent = '购买';
                buyBtn.disabled = false;
            }
        });
    }

    // 购买物品
    buyItem(item, cost, shopItem) {
        if (this.score >= cost && !this.equippedItems.includes(item)) {
            this.score -= cost;
            this.equippedItems.push(item);
            this.updateChickenAppearance();
            this.updateDisplay();
            this.updateShopButtons();
            this.showMessage(`成功购买 ${this.getItemName(item)}！`, 'success');
        }
    }

    // 获取物品名称
    getItemName(item) {
        const names = {
            'hat': '时尚帽子',
            'glasses': '酷炫眼镜',
            'scarf': '温暖围巾',
            'shoes': '运动鞋'
        };
        return names[item] || item;
    }

    // 更新小鸡外观
    updateChickenAppearance() {
        const accessoriesDiv = document.querySelector('.chicken-accessories');
        accessoriesDiv.innerHTML = '';
        
        this.equippedItems.forEach(item => {
            const accessory = document.createElement('div');
            accessory.className = `accessory ${item}`;
            accessory.textContent = this.getAccessoryEmoji(item);
            accessoriesDiv.appendChild(accessory);
        });
    }

    // 获取配件表情
    getAccessoryEmoji(item) {
        const emojis = {
            'hat': '🎩',
            'glasses': '👓',
            'scarf': '🧣',
            'shoes': '👟'
        };
        return emojis[item] || '✨';
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