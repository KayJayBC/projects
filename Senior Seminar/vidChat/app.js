const http = require('http')
const port = 3333
const fs = require('fs')
const server = http.createServer(function(req, res){
  res.writeHead(200, {'Content-Type' : 'text/html'})
  fs.readFile('index.html', function(error, data){
    if(error){
      res.writeHead(404)
      res.write('Error 404: File Not Found')
    }else{
      res.write(data)
    }
    res.end()
  })
})

server.listen(port, function(error){
  if(error){
    console.log('Error occured', error)
  }else{
    console.log('Server is listening;Port: ' + port)
  }

})