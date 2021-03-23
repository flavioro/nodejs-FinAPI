const express = require('express')

const {v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json());

const customers = []

// app.use(verifyIfExistsAccountCPF)

function verifyIfExistsAccountCPF(request, response, next) {
  const {cpf } = request.headers

  const customer = customers.find(
    (customer) => customer.cpf === cpf
  )

  if (!customer) {
    return response.status(400).json({error: "Customer not found"})
  }

  request.customer = customer

  return next()
}


app.post('/account', (request, response) => {
  const {cpf, name } = request.body;

  const customerAlreadyExistis = customers.some(
    (customer) => customer.cpf === cpf
  )

  if (customerAlreadyExistis) {
    return response.status(400).json({ error: "Customer already Exists!"})
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return response.status(201).send("Success!!")

})

// app.get('/statement/:cpf', (request, response) => {
//   const {cpf } = request.params;

//   const customerBank = customers.find(
//     (customer) => customer.cpf === cpf
//   )

//   if (!customerBank) {
//     return response.status(400).json({error: "Customer not found"})
//   }

//   return response.json(customerBank.statement)
// })

app.get('/statement/', verifyIfExistsAccountCPF, (request, response) => {
  return response.json(request.customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body

  const { customer } = request

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
})

function getBalance(statement) {
  const balance = statement.reduce((accumulator, operation) => {
    if (operation.type === 'credit') {
      return accumulator + operation.amount
    }else {
      return accumulator - operation.amount
    }
  }, 0)
  return balance
}

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body

  const { customer } = request

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return response.status(400).json({ err: "Insufficient funds!"})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.listen(3333)