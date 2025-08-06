const form = document.querySelector("#form-habits")
const nlwSetup = new NLWSetup(form)
const addDayButton = document.querySelector("#add-day-btn")
const addHabitButton = document.querySelector("#add-habit-btn")
const habitModal = document.querySelector("#habit-modal")
const newHabitForm = document.querySelector("#new-habit-form")
const cancelHabitButton = document.querySelector("#cancel-habit")

// Elementos das estatísticas
const totalDaysElement = document.querySelector("#total-days")
const completedHabitsElement = document.querySelector("#completed-habits")
const completionRateElement = document.querySelector("#completion-rate")
const currentStreakElement = document.querySelector("#current-streak")

// Event listeners
addDayButton.addEventListener("click", addDay)
form.addEventListener("change", save)
addHabitButton.addEventListener("click", openHabitModal)
cancelHabitButton.addEventListener("click", closeHabitModal)
newHabitForm.addEventListener("submit", addNewHabit)

// Event listener para remover hábitos (usando delegação de eventos)
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("habit-remove")) {
    e.preventDefault()
    e.stopPropagation()
    removeHabit(e.target.closest(".habit"))
  }
})
// Fechar modal clicando fora
habitModal.addEventListener("click", (e) => {
  if (e.target === habitModal) {
    closeHabitModal()
  }
})

// Função para adicionar um novo dia
function addDay() {
  const today = new Date().toLocaleDateString("pt-br").slice(0, -5)
  const dayExists = nlwSetup.dayExists(today)

  if (dayExists) {
    showNotification("Dia já adicionado! ⚠️", "warning")
    return
  }
  
  showNotification("Dia adicionado com sucesso! ✅", "success")
  nlwSetup.addDay(today)
  updateStats()
}

// Função para salvar dados
function save() {
  localStorage.setItem("NLWSetup@habits", JSON.stringify(nlwSetup.data))
  updateStats()
}

// Função para abrir modal de novo hábito
function openHabitModal() {
  habitModal.classList.add("active")
  document.querySelector("#habit-name").focus()
}

// Função para fechar modal de novo hábito
function closeHabitModal() {
  habitModal.classList.remove("active")
  newHabitForm.reset()
}

// Função para adicionar novo hábito
function addNewHabit(e) {
  e.preventDefault()
  
  const habitName = document.querySelector("#habit-name").value.trim()
  const habitEmoji = document.querySelector("#habit-emoji").value.trim() || "🎯"
  
  if (!habitName) return
  
  // Criar elemento do hábito
  const habitElement = document.createElement("div")
  habitElement.className = "habit"
  habitElement.dataset.name = habitName.toLowerCase().replace(/\s+/g, "")
  habitElement.innerHTML = `
    ${habitEmoji}
    <button class="habit-remove" title="Remover hábito">×</button>
    <div class="habit-tooltip">${habitName}</div>
  `
  
  // Adicionar antes do botão de adicionar
  const habitsContainer = document.querySelector(".habits")
  habitsContainer.insertBefore(habitElement, addHabitButton)
  
  // Salvar hábitos customizados
  saveCustomHabits()
  
  closeHabitModal()
  showNotification(`Hábito "${habitName}" adicionado! 🎉`, "success")
}

// Função para remover hábito
function removeHabit(habitElement) {
  const habitName = habitElement.querySelector(".habit-tooltip")?.textContent || "este hábito"
  
  // Confirmar remoção
  if (!confirm(`Tem certeza que deseja remover "${habitName}"?\n\nIsso também removerá todos os dados deste hábito dos dias já registrados.`)) {
    return
  }
  
  const habitDataName = habitElement.dataset.name
  
  // Remover dados do hábito de todos os dias
  const data = nlwSetup.data || {}
  Object.keys(data).forEach(day => {
    const dayHabits = data[day] || []
    const habitIndex = dayHabits.indexOf(habitDataName)
    if (habitIndex > -1) {
      dayHabits.splice(habitIndex, 1)
      data[day] = dayHabits
    }
  })
  
  // Atualizar dados no nlwSetup
  nlwSetup.setData(data)
  
  // Remover elemento visual
  habitElement.remove()
  
  // Salvar alterações
  save()
  saveCustomHabits()
  
  // Recarregar interface para atualizar os dias
  nlwSetup.load()
  
  showNotification(`Hábito "${habitName}" removido! 🗑️`, "warning")
  
  // Atualizar estatísticas
  setTimeout(() => {
    updateStats()
    addDayHoverEffects()
  }, 100)
}
// Função para salvar hábitos customizados
function saveCustomHabits() {
  const habits = Array.from(document.querySelectorAll(".habit")).map(habit => ({
    name: habit.dataset.name,
    emoji: habit.textContent.trim().split('\n')[0],
    tooltip: habit.querySelector(".habit-tooltip")?.textContent || habit.dataset.name
  }))
  
  localStorage.setItem("customHabits", JSON.stringify(habits))
}

// Função para carregar hábitos customizados
function loadCustomHabits() {
  const customHabits = JSON.parse(localStorage.getItem("customHabits") || "[]")
  
  if (customHabits.length > 0) {
    const habitsContainer = document.querySelector(".habits")
    const addButton = document.querySelector(".add-habit-btn")
    
    // Limpar hábitos existentes (exceto o botão de adicionar)
    const existingHabits = habitsContainer.querySelectorAll(".habit")
    existingHabits.forEach(habit => habit.remove())
    
    // Adicionar hábitos customizados
    customHabits.forEach(habit => {
      const habitElement = document.createElement("div")
      habitElement.className = "habit"
      habitElement.dataset.name = habit.name
      habitElement.innerHTML = `
        ${habit.emoji}
        <button class="habit-remove" title="Remover hábito">×</button>
        <div class="habit-tooltip">${habit.tooltip}</div>
      `
      habitsContainer.insertBefore(habitElement, addButton)
    })
  }
}

// Função para atualizar estatísticas
function updateStats() {
  const data = nlwSetup.data || {}
  const days = Object.keys(data)
  const totalDays = days.length
  
  let completedHabits = 0
  let totalPossibleHabits = 0
  let currentStreak = 0
  
  // Calcular hábitos concluídos e taxa de conclusão
  days.forEach(day => {
    const dayHabits = data[day] || []
    const habitsCount = document.querySelectorAll(".habit").length
    completedHabits += dayHabits.length
    totalPossibleHabits += habitsCount
  })
  
  // Calcular sequência atual
  const today = new Date()
  let checkDate = new Date(today)
  
  while (true) {
    const dateString = checkDate.toLocaleDateString("pt-br").slice(0, -5)
    const dayData = data[dateString]
    
    if (dayData && dayData.length > 0) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  
  const completionRate = totalPossibleHabits > 0 ? Math.round((completedHabits / totalPossibleHabits) * 100) : 0
  
  // Atualizar elementos
  totalDaysElement.textContent = totalDays
  completedHabitsElement.textContent = completedHabits
  completionRateElement.textContent = `${completionRate}%`
  currentStreakElement.textContent = currentStreak
  
  // Adicionar animação aos números
  animateNumber(totalDaysElement)
  animateNumber(completedHabitsElement)
  animateNumber(currentStreakElement)
}

// Função para animar números
function animateNumber(element) {
  element.style.transform = "scale(1.1)"
  element.style.color = "var(--accent)"
  
  setTimeout(() => {
    element.style.transform = "scale(1)"
    element.style.color = ""
  }, 200)
}

// Função para mostrar notificações
function showNotification(message, type = "info") {
  // Remover notificação existente
  const existingNotification = document.querySelector(".notification")
  if (existingNotification) {
    existingNotification.remove()
  }
  
  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.textContent = message
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 16px 20px;
    border-radius: 12px;
    border: 1px solid var(--border-primary);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    z-index: 1001;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `
  
  if (type === "success") {
    notification.style.borderColor = "var(--success)"
  } else if (type === "warning") {
    notification.style.borderColor = "var(--warning)"
  }
  
  document.body.appendChild(notification)
  
  // Animar entrada
  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)
  
  // Remover após 3 segundos
  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      notification.remove()
    }, 300)
  }, 3000)
}

// Função para adicionar efeitos de hover nos dias
function addDayHoverEffects() {
  const days = document.querySelectorAll(".day")
  
  days.forEach(day => {
    const dayHeader = day.querySelector("div")
    if (dayHeader) {
      dayHeader.classList.add("day-header")
      
      // Adicionar progresso do dia
      const inputs = day.querySelectorAll("input[type='checkbox']")
      const checkedInputs = day.querySelectorAll("input[type='checkbox']:checked")
      const progress = inputs.length > 0 ? Math.round((checkedInputs.length / inputs.length) * 100) : 0
      
      const progressElement = document.createElement("div")
      progressElement.className = "day-progress"
      progressElement.textContent = `${progress}%`
      dayHeader.appendChild(progressElement)
    }
  })
}

// Inicialização
function init() {
  // Carregar dados salvos
  const data = JSON.parse(localStorage.getItem("NLWSetup@habits")) || {}
  nlwSetup.setData(data)
  
  // Carregar hábitos customizados
  loadCustomHabits()
  
  // Carregar interface
  nlwSetup.load()
  
  // Atualizar estatísticas
  updateStats()
  
  // Adicionar efeitos aos dias (com delay para garantir que foram criados)
  setTimeout(() => {
    addDayHoverEffects()
  }, 100)
  
  // Atualizar estatísticas periodicamente
  setInterval(updateStats, 5000)
}

// Inicializar quando a página carregar
document.addEventListener("DOMContentLoaded", init)

// Adicionar suporte a teclado para acessibilidade
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && habitModal.classList.contains("active")) {
    closeHabitModal()
  }
})