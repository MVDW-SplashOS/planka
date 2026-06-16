/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const moment = require("moment");

const RECURRENCE_TYPE_TO_ADD = {
  daily: [1, "days"],
  weekly: [1, "weeks"],
  monthly: [1, "months"],
  yearly: [1, "years"],
};

module.exports = {
  inputs: {
    card: {
      type: "ref",
      required: true,
    },
    recurrence: {
      type: "ref",
      required: true,
    },
    project: {
      type: "ref",
      required: true,
    },
    board: {
      type: "ref",
      required: true,
    },
    list: {
      type: "ref",
      required: true,
    },
    actorUser: {
      type: "ref",
      required: true,
    },
    request: {
      type: "ref",
    },
  },

  async fn(inputs) {
    const { card, recurrence, project, board, list, actorUser } = inputs;

    if (!card.dueDate) {
      return null;
    }

    const dueDate = moment(card.dueDate);
    const [amount, unit] = RECURRENCE_TYPE_TO_ADD[recurrence.type];
    const nextDueDate = dueDate.clone().add(amount * recurrence.interval, unit);

    // Determine the target list: use the configured listId or stay in the current list
    let targetList = list;
    if (recurrence.listId) {
      targetList = await List.qm.getOneById(recurrence.listId, {
        boardId: board.id,
      });

      if (!targetList) {
        targetList = list; // fallback to current list
      }
    }

    const typeState = List.TYPE_STATE_BY_TYPE[targetList.type];

    // Update the card: move to target list, update due date, reopen
    const updateValues = {
      dueDate: nextDueDate.toISOString(),
      isDueCompleted: false,
      listChangedAt: new Date().toISOString(),
    };

    if (targetList.id !== list.id) {
      updateValues.listId = targetList.id;

      if (sails.helpers.lists.isArchiveOrTrash(targetList)) {
        updateValues.prevListId = list.id;
      }

      if (card.isClosed) {
        if (typeState === List.TypeStates.OPENED) {
          updateValues.isClosed = false;
        }
      } else if (typeState === List.TypeStates.CLOSED) {
        updateValues.isClosed = true;
      }
    }

    const { card: updatedCard } = await Card.qm.updateOne(
      card.id,
      updateValues,
    );

    // Broadcast the card update
    sails.sockets.broadcast(
      `board:${card.boardId}`,
      "cardUpdate",
      {
        item: updatedCard,
      },
      inputs.request,
    );

    const webhooks = await Webhook.qm.getAll();
    const t = sails.helpers.utils.makeTranslator(actorUser.language);

    // Create a system comment about the reopening
    const formattedDate = t("format:date", {
      postProcess: "formatDate",
      value: new Date(nextDueDate),
    });

    const systemComment = await sails.helpers.comments.createOne.with({
      project,
      board,
      list: targetList,
      values: {
        card,
        user: actorUser,
        text: `@card ${t("recurringCardReopened", { dueDate: formattedDate })}`,
      },
      request: inputs.request,
    });

    // Add activity for the move action
    await sails.helpers.actions.createOne.with({
      project,
      board,
      list: targetList,
      webhooks,
      values: {
        card,
        type: Action.Types.MOVE_CARD,
        data: {
          card: _.pick(updatedCard, ["name", "dueDate"]),
          fromList: _.pick(list, ["id", "type", "name"]),
          toList: _.pick(targetList, ["id", "type", "name"]),
        },
        user: actorUser,
      },
    });

    // Send webhooks
    sails.helpers.utils.sendWebhooks.with({
      webhooks,
      event: Webhook.Events.CARD_UPDATE,
      buildData: () => ({
        item: updatedCard,
        included: {
          projects: [project],
          boards: [board],
          lists: [targetList],
        },
      }),
      buildPrevData: () => ({
        item: card,
        included: {
          projects: [inputs.project],
          boards: [inputs.board],
          lists: [inputs.list],
        },
      }),
      user: actorUser,
    });

    return updatedCard;
  },
};
