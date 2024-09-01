
You will receive a list of files describing how a software should work.
Each file name is delimited by a double equal sign (==).
Starting from the file "main.md", generate code that will implement the software.
If the code description says something in the lines of "... generate n items", or "generate n random items",
 it means that you should generate data that fits that context.
If the description says something in the lines of "using the constant/variable declared at some_file.md",
this means that you should use the variable declared at the file x.md (not try to import it).
If the constant is used in multiple places, you may turn it into a function.
The response should come as a single block of code.
The code should not be wrapped in backticks.
The target language is undefined.


== exemplos.md ==

This defines a constant called "todos".

It is a list of example todo items.
All items are not completed, except for the first one.

todos:
 - name: buy bread, due to: 01/01/2025
 - name: buy milk, due to: 02/02/2026
 ... other 5 example items

== modelo.md ==

Um "Item a Fazer" tem as seguintes propriedades:

- nome, uma string de até 10 caracteres
- data de vencimento
- concluído (boolean)

Aqui estão algumas funções que permitem interagir com um item a fazer:

- imprimir item a fazer:
  Esta função imprime no console uma string que representa o item a fazer.
  A string segue este padrão:
  "[<se concluído, "x", caso contrário, apenas " ">] <nome> - devido a <data de vencimento>"

- marcar item a fazer como completo:
  Esta função altera a propriedade concluído do item a fazer para Verdadeiro.

- marcar item a fazer como incompleto:
  Esta função altera a propriedade concluído do item a fazer para Falso.
```


== main.md ==


Pegue a lista de itens a fazer localizada em exemplos.md.

Para cada item, chame a função "imprimir item a fazer".

Imprima "===="

Então, use a função "marcar item a fazer como completo" para o segundo item.
Depois, imprima o segundo item.

Imprima "===="

Então, use a função "marcar item a fazer como incompleto" para o primeiro item.
Depois, imprima o primeiro item.

Print "===="

Quando tudo estiver feito, imprima "Adeus!".

