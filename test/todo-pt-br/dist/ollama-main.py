# exemplos.md - Definição dos itens de exemplo
todos = [
    {"nome": "buy bread", "data_de_vencimento": "01/01/2025", "concluido": True},
    {"nome": "buy milk", "data_de_vencimento": "02/02/2026", "concluido": False},
    {"nome": "item 3", "data_de_vencimento": "03/03/2027", "concluido": False},
    {"nome": "item 4", "data_de_vencimento": "04/04/2028", "concluido": False},
    {"nome": "item 5", "data_de_vencimento": "05/05/2029", "concluido": False},
    {"nome": "item 6", "data_de_vencimento": "06/06/2030", "concluido": False},
    {"nome": "item 7", "data_de_vencimento": "07/07/2031", "concluido": False},
]

# modelo.md - Funções de interação com um item a fazer


def imprimir_item(item):
    status = "x" if item["concluido"] else " "
    print(f"[{status}] {item['nome']} - devido a {item['data_de_vencimento']}")


def marcar_completo(item):
    item["concluido"] = True


def marcar_incompleto(item):
    item["concluido"] = False


# main.md - Lógica principal
if __name__ == "__main__":
    # Imprime todos os itens a fazer
    for item in todos:
        imprimir_item(item)

    print("====")

    # Marca o segundo item como completo e o imprime
    marcar_completo(todos[1])
    imprimir_item(todos[1])

    print("====")

    # Marca o primeiro item como incompleto e o imprime
    marcar_incompleto(todos[0])
    imprimir_item(todos[0])

    print("====")
    # Imprime a mensagem final
    print("Adeus!")
