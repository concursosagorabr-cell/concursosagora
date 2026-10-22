"""PoC de monitor de fontes oficiais com um trabalhador OpenHands opcional.

O monitor determinístico desta pasta nunca publica, nunca escreve no Sanity e
nunca chama um LLM. O trabalhador OpenHands é opcional e recebe apenas o diff
já coletado; a validação final continua sendo feita por código determinístico.
"""
