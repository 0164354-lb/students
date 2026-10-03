// ─── CONFIGURACIÓN SUPABASE ──────────────────────────────────────────────────
const { createClient } = supabase
const db = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)

// ─── NAVEGACIÓN ──────────────────────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
  document.getElementById(`view-${name}`).classList.add('active')
  event.target.classList.add('active')

  if (name === 'chart') renderChart()
  if (name === 'table') renderTable(1) // Reiniciar a página 1 al cambiar a tabla
  if (name === 'predict') {
    document.getElementById('prediction-result').style.display = 'none'
    document.getElementById('predict-form').reset()
  }
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.querySelector('.toast')
  if (!t) {
    t = document.createElement('div')
    t.className = 'toast'
    document.body.appendChild(t)
  }
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2000)
}

// ─── GRÁFICA ─────────────────────────────────────────────────────────────────
// Promedio de math/reading/writing agrupado por parental_education
async function renderChart() {
  renderParentalEducationChart()
  renderGenderChart()
  renderTestPrepChart()
  renderLunchChart()
}

async function renderParentalEducationChart() {
  const { data, error } = await db.from('students').select('parental_education, math_score, reading_score, writing_score')
  if (error) { console.error(error); return }

  // Agrupar manualmente
  const groups = {}
  data.forEach(r => {
    const key = r.parental_education
    if (!groups[key]) groups[key] = { math: [], reading: [], writing: [] }
    groups[key].math.push(r.math_score)
    groups[key].reading.push(r.reading_score)
    groups[key].writing.push(r.writing_score)
  })

  const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

  // Orden lógico del nivel educativo
  const order = ["some high school", "high school", "some college", "associate's degree", "bachelor's degree", "master's degree"]
  const labels = order.filter(k => groups[k])

  const ctx = document.getElementById('myChart').getContext('2d')

  // Destruir chart previo si existe
  if (window._chart) window._chart.destroy()

  window._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [
        {
          label: 'Matemáticas',
          data: labels.map(l => avg(groups[l].math)),
          backgroundColor: 'rgba(0,113,227,0.8)',
          borderRadius: 8,
        },
        {
          label: 'Lectura',
          data: labels.map(l => avg(groups[l].reading)),
          backgroundColor: 'rgba(52,199,89,0.8)',
          borderRadius: 8,
        },
        {
          label: 'Escritura',
          data: labels.map(l => avg(groups[l].writing)),
          backgroundColor: 'rgba(255,159,10,0.8)',
          borderRadius: 8,
        },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#1d1d1f',
            font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' }
          }
        },
      },
      scales: {
        x: {
          ticks: { color: '#86868b', font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' } },
          grid: { color: '#e5e5ea' }
        },
        y: {
          ticks: { color: '#86868b', font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' } },
          grid: { color: '#e5e5ea' },
          min: 50, max: 80,
          title: { display: true, text: 'Promedio', color: '#86868b', font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' } }
        }
      }
    }
  })
}

async function renderGenderChart() {
  const { data, error } = await db.from('students').select('gender')
  if (error) { console.error(error); return }

  const genderCount = {}
  data.forEach(r => {
    genderCount[r.gender] = (genderCount[r.gender] || 0) + 1
  })

  const ctx = document.getElementById('genderChart').getContext('2d')

  if (window._genderChart) window._genderChart.destroy()

  window._genderChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Male', 'Female'],
      datasets: [{
        data: [genderCount.male || 0, genderCount.female || 0],
        backgroundColor: [
          'rgba(0,113,227,0.8)',
          'rgba(255,45,85,0.8)'
        ],
        borderColor: [
          'rgba(0,113,227,1)',
          'rgba(255,45,85,1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#1d1d1f',
            font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' }
          }
        }
      }
    }
  })
}

async function renderTestPrepChart() {
  const { data, error } = await db.from('students').select('test_prep, math_score, reading_score, writing_score')
  if (error) { console.error(error); return }

  const groups = {}
  data.forEach(r => {
    const key = r.test_prep
    if (!groups[key]) groups[key] = { math: [], reading: [], writing: [] }
    groups[key].math.push(r.math_score)
    groups[key].reading.push(r.reading_score)
    groups[key].writing.push(r.writing_score)
  })

  const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

  const ctx = document.getElementById('testPrepChart').getContext('2d')

  if (window._testPrepChart) window._testPrepChart.destroy()

  window._testPrepChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Sin preparación', 'Con preparación'],
      datasets: [
        {
          label: 'Matemáticas',
          data: [avg(groups.none?.math || [0]), avg(groups.completed?.math || [0])],
          backgroundColor: 'rgba(0,113,227,0.8)',
          borderRadius: 8,
        },
        {
          label: 'Lectura',
          data: [avg(groups.none?.reading || [0]), avg(groups.completed?.reading || [0])],
          backgroundColor: 'rgba(52,199,89,0.8)',
          borderRadius: 8,
        },
        {
          label: 'Escritura',
          data: [avg(groups.none?.writing || [0]), avg(groups.completed?.writing || [0])],
          backgroundColor: 'rgba(255,159,10,0.8)',
          borderRadius: 8,
        },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#1d1d1f',
            font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' }
          }
        },
      },
      scales: {
        x: {
          ticks: { color: '#86868b', font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' } },
          grid: { color: '#e5e5ea' }
        },
        y: {
          ticks: { color: '#86868b', font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' } },
          grid: { color: '#e5e5ea' },
          min: 50, max: 80,
          title: { display: true, text: 'Promedio', color: '#86868b', font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' } }
        }
      }
    }
  })
}

async function renderLunchChart() {
  const { data, error } = await db.from('students').select('lunch, math_score, reading_score, writing_score')
  if (error) { console.error(error); return }

  const groups = {}
  data.forEach(r => {
    const key = r.lunch
    if (!groups[key]) groups[key] = { math: [], reading: [], writing: [] }
    groups[key].math.push(r.math_score)
    groups[key].reading.push(r.reading_score)
    groups[key].writing.push(r.writing_score)
  })

  const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

  const ctx = document.getElementById('lunchChart').getContext('2d')

  if (window._lunchChart) window._lunchChart.destroy()

  window._lunchChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Standard', 'Free/Reduced'],
      datasets: [
        {
          label: 'Matemáticas',
          data: [avg(groups.standard?.math || [0]), avg(groups['free/reduced']?.math || [0])],
          backgroundColor: 'rgba(0,113,227,0.8)',
          borderRadius: 8,
        },
        {
          label: 'Lectura',
          data: [avg(groups.standard?.reading || [0]), avg(groups['free/reduced']?.reading || [0])],
          backgroundColor: 'rgba(52,199,89,0.8)',
          borderRadius: 8,
        },
        {
          label: 'Escritura',
          data: [avg(groups.standard?.writing || [0]), avg(groups['free/reduced']?.writing || [0])],
          backgroundColor: 'rgba(255,159,10,0.8)',
          borderRadius: 8,
        },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#1d1d1f',
            font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' }
          }
        },
      },
      scales: {
        x: {
          ticks: { color: '#86868b', font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' } },
          grid: { color: '#e5e5ea' }
        },
        y: {
          ticks: { color: '#86868b', font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' } },
          grid: { color: '#e5e5ea' },
          min: 50, max: 80,
          title: { display: true, text: 'Promedio', color: '#86868b', font: { family: '-apple-system, BlinkMacSystemFont, sans-serif' } }
        }
      }
    }
  })
}

// ─── TABLA ───────────────────────────────────────────────────────────────────
const EDITABLE_COLS = ['math_score', 'reading_score', 'writing_score']
const PAGE_SIZE = 100
let currentPage = 1
let totalPages = 1
let totalRecords = 0

async function renderTable(page = 1) {
  console.log('renderTable called with page:', page)
  currentPage = page
  const tbody = document.getElementById('table-body')
  tbody.innerHTML = '<tr><td colspan="11" class="loading">Cargando...</td></tr>'

  try {
    // Calcular el rango para la paginación
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    console.log('Fetching from', from, 'to', to)

    const { data, error, count } = await db
      .from('students')
      .select('*', { count: 'exact' })
      .order('id', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Supabase error:', error)
      tbody.innerHTML = `<tr><td colspan="11" class="loading">Error: ${error.message} - ${error.hint || ''}</td></tr>`
      return
    }

    console.log('Data loaded:', data?.length || 0, 'rows, total:', count, 'pages:', Math.ceil((count || 0) / PAGE_SIZE))

    totalRecords = count || 0
    totalPages = Math.ceil(totalRecords / PAGE_SIZE)
    
    tbody.innerHTML = ''

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="loading">No hay datos disponibles</td></tr>'
      updatePaginationControls()
      return
    }

    data.forEach(row => {
    const tr = document.createElement('tr')

    const cols = ['id', 'gender', 'ethnicity', 'parental_education', 'lunch', 'test_prep', 'math_score', 'reading_score', 'writing_score', 'pass_math']

    cols.forEach(col => {
      const td = document.createElement('td')

      if (col === 'pass_math') {
        td.innerHTML = row[col] === 1
          ? '<span class="badge pass">Aprobado</span>'
          : '<span class="badge fail">Reprobado</span>'
      } else if (EDITABLE_COLS.includes(col)) {
        td.textContent = row[col]
        td.contentEditable = 'true'
        td.addEventListener('blur', () => saveCell(row.id, col, td.textContent.trim(), td, tr))
      } else {
        td.textContent = row[col]
      }

      tr.appendChild(td)
    })

    // Agregar botones de acción
    const actionTd = document.createElement('td')
    actionTd.innerHTML = `
      <div class="action-buttons">
        <button class="action-btn edit" onclick="openEditModal(${row.id})" title="Editar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="action-btn delete" onclick="deleteRecord(${row.id})" title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `
    tr.appendChild(actionTd)

    tbody.appendChild(tr)
  })
  
  console.log('Table rendered with', tbody.children.length, 'rows')
  
  // Actualizar controles de paginación
  updatePaginationControls()
  } catch (err) {
    console.error('Unexpected error in renderTable:', err)
    tbody.innerHTML = `<tr><td colspan="11" class="loading">Error inesperado: ${err.message}</td></tr>`
  }
}

// ─── CONTROLES DE PAGINACIÓN ──────────────────────────────────────────────────
function updatePaginationControls() {
  document.getElementById('current-page').textContent = currentPage
  document.getElementById('total-pages').textContent = totalPages
  
  document.getElementById('prev-btn').disabled = currentPage === 1
  document.getElementById('next-btn').disabled = currentPage === totalPages
}

function prevPage() {
  if (currentPage > 1) {
    renderTable(currentPage - 1)
  }
}

function nextPage() {
  if (currentPage < totalPages) {
    renderTable(currentPage + 1)
  }
}

// ─── GUARDAR CELDA EN SUPABASE ────────────────────────────────────────────────
async function saveCell(id, column, value, td, tr) {
  const numVal = Number(value)
  if (isNaN(numVal) || numVal < 0 || numVal > 100) {
    showToast('Valor inválido (0–100)')
    return
  }

  // Recalcular pass_math si se edita math_score
  const updates = { [column]: numVal }
  if (column === 'math_score') {
    updates.pass_math = numVal >= 60 ? 1 : 0
  }

  const { error } = await db.from('students').update(updates).eq('id', id)

  if (error) {
    showToast('Error al guardar')
    console.error(error)
    return
  }

  showToast('Guardado ✓')

  // Actualizar badge de pass_math en la misma fila si aplica
  if (column === 'math_score') {
    const lastTd = tr.querySelector('td:last-child')
    lastTd.innerHTML = numVal >= 60
      ? '<span class="badge pass">Aprobado</span>'
      : '<span class="badge fail">Reprobado</span>'
  }
  
  // Recargar la tabla manteniendo la página actual
  renderTable(currentPage)
}

// ─── MODAL DE EDICIÓN ──────────────────────────────────────────────────────────
async function openEditModal(id) {
  const { data, error } = await db.from('students').select('*').eq('id', id).single()

  if (error) {
    showToast('Error al cargar registro')
    console.error(error)
    return
  }

  // Llenar el formulario con los datos
  document.getElementById('edit-id').value = data.id
  document.getElementById('edit-gender').value = data.gender
  document.getElementById('edit-ethnicity').value = data.ethnicity
  document.getElementById('edit-parental-education').value = data.parental_education
  document.getElementById('edit-lunch').value = data.lunch
  document.getElementById('edit-test-prep').value = data.test_prep
  document.getElementById('edit-math-score').value = data.math_score
  document.getElementById('edit-reading-score').value = data.reading_score
  document.getElementById('edit-writing-score').value = data.writing_score

  // Mostrar el modal
  document.getElementById('edit-modal').classList.add('show')
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('show')
  document.getElementById('edit-form').reset()
}

// ─── MODAL DE AGREGAR REGISTRO ─────────────────────────────────────────────────
function openAddModal() {
  // Limpiar el formulario
  document.getElementById('add-form').reset()
  
  // Calcular el siguiente ID disponible
  getNextAvailableId().then(nextId => {
    document.getElementById('add-id').value = nextId
  })
  
  // Mostrar el modal
  document.getElementById('add-modal').classList.add('show')
}

function closeAddModal() {
  document.getElementById('add-modal').classList.remove('show')
  document.getElementById('add-form').reset()
}

async function getNextAvailableId() {
  const { data, error } = await db
    .from('students')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
  
  if (error || !data || data.length === 0) {
    return 1
  }
  
  return data[0].id + 1
}

// Manejar el envío del formulario de agregar
document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const formData = new FormData(e.target)

  const newRecord = {
    id: Number(formData.get('id')),
    gender: formData.get('gender'),
    ethnicity: formData.get('ethnicity'),
    parental_education: formData.get('parental_education'),
    lunch: formData.get('lunch'),
    test_prep: formData.get('test_prep'),
    math_score: Number(formData.get('math_score')),
    reading_score: Number(formData.get('reading_score')),
    writing_score: Number(formData.get('writing_score')),
    pass_math: Number(formData.get('math_score')) >= 60 ? 1 : 0
  }

  const { error } = await db.from('students').insert(newRecord)

  if (error) {
    showToast('Error al agregar registro')
    console.error(error)
    return
  }

  showToast('Registro agregado ✓')
  closeAddModal()
  renderTable(currentPage) // Recargar la tabla
})

// Manejar el envío del formulario de edición
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const id = document.getElementById('edit-id').value
  const formData = new FormData(e.target)

  const updates = {
    gender: formData.get('gender'),
    ethnicity: formData.get('ethnicity'),
    parental_education: formData.get('parental_education'),
    lunch: formData.get('lunch'),
    test_prep: formData.get('test_prep'),
    math_score: Number(formData.get('math_score')),
    reading_score: Number(formData.get('reading_score')),
    writing_score: Number(formData.get('writing_score')),
  }

  // Recalcular pass_math
  updates.pass_math = updates.math_score >= 60 ? 1 : 0

  const { error } = await db.from('students').update(updates).eq('id', id)

  if (error) {
    showToast('Error al guardar cambios')
    console.error(error)
    return
  }

  showToast('Cambios guardados ✓')
  closeModal()
  renderTable() // Recargar la tabla
})

// ─── ELIMINAR REGISTRO ─────────────────────────────────────────────────────────
async function deleteRecord(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.')) {
    return
  }

  const { error } = await db.from('students').delete().eq('id', id)

  if (error) {
    showToast('Error al eliminar registro')
    console.error(error)
    return
  }

  showToast('Registro eliminado ✓')
  
  // Si estamos en la última página y se eliminó el último registro, ir a la página anterior
  if (currentPage === totalPages && totalRecords % PAGE_SIZE === 1) {
    currentPage = Math.max(1, currentPage - 1)
  }

  renderTable(currentPage) // Recargar la tabla manteniendo la página actual
}

// ─── PREDICCIÓN ───────────────────────────────────────────────────────────────
document.getElementById('predict-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const formData = new FormData(e.target)

  const payload = {
    gender: formData.get('gender'),
    ethnicity: formData.get('ethnicity'),
    parental_education: formData.get('parental_education'),
    lunch: formData.get('lunch'),
    test_prep: formData.get('test_prep'),
    reading_score: Number(formData.get('reading_score')),
    writing_score: Number(formData.get('writing_score')),
  }

  try {
    const response = await fetch(`${CONFIG.ML_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Error en la predicción')
    }

    const result = await response.text()
    const passes = result === 'pasa'

    const resultDiv = document.getElementById('prediction-result')
    const badgeDiv = document.getElementById('prediction-badge')
    const messageDiv = document.getElementById('prediction-message')

    badgeDiv.textContent = passes ? '✓ APRUEBA' : '✗ REPRUEBA'
    badgeDiv.className = passes ? 'pass' : 'fail'
    messageDiv.textContent = passes
      ? 'El modelo predice que este estudiante aprobará matemáticas.'
      : 'El modelo predice que este estudiante reprobará matemáticas.'

    resultDiv.style.display = 'block'
    showToast('Predicción completada ✓')
  } catch (error) {
    console.error('Error en la predicción:', error)
    showToast('Error al conectar con la API de ML. Asegúrate de que el servidor esté corriendo.')
  }
})

// ─── INIT ────────────────────────────────────────────────────────────────────
renderTable(1) // Cargar tabla por defecto al iniciar