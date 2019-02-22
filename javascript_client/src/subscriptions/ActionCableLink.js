import {ApolloLink, Observable} from "apollo-link";
import { print } from "graphql/language";

function ActionCableLink(options) {
  var cable = options.cable
  var channelName = options.channelName || "GraphqlChannel"
  var actionName = options.actionName || "execute"
  var connectionParams = options.connectionParams

  if (typeof connectionParams !== "object") {
    connectionParams = {}
  }

  return new ApolloLink(function(operation) {
    return new Observable(function(observer) {
      var channelId = Math.round(Date.now() + Math.random() * 100000).toString(16)

      var subscription = cable.subscriptions.create(Object.assign({},{
        channel: channelName,
        channelId: channelId
      }, connectionParams), {
        connected: function() {
          this.perform(
            actionName,
            {
              query: operation.query ? print(operation.query) : null,
              variables: operation.variables,
              operationId: operation.operationId,
              operationName: operation.operationName
            }
          )
        },
        received: function(payload) {
          if (payload.result.data) {
            observer.next(payload.result)
          }

          if (!payload.more) {
            this.unsubscribe()
            observer.complete()
          }
        }
      })

      return subscription
    })
  })
}

export default ActionCableLink