var chat = {
    exitable: false,
    user: null,
    socket: null,
    visible: false,

    init: function() {
        chat.user = USER;
        chat.initSocket();

        $('#chat, #chatExit').on('click touchstart', function(e) {
            chat.hide();
        });

        $('#chatContainer').on('click touchstart', function(e) {
            e.stopPropagation();
        });

        $('.openChat').on('click', function(e) {
            chat.show();
        });

        if(chat.user.role === 'support') {
            chat.show();
            $('#chat, #chatExit').off('click touchstart');
        }
    },

    initSocket: function() {
        if(typeof(io) !== 'undefined') {
            chat.socket = io();

            chat.inbox.init();
            chat.conversation.init();
        } else {
            setTimeout(function() {
                chat.initSocket();
            }, 500);
        }
    },

    show: function() {
        chat.exitable = false;
        $('#chat').stop().fadeIn(300, function() {
            $('#chatReply').focus();
            chat.exitable = true;
            chat.visible = true;
        });

        $("#chatFlow").scrollTop($("#chatFlow")[0].scrollHeight);
    },

    hide: function() {
        if(chat.exitable) $('#chat').stop().fadeOut(300, function() {
            chat.visible = false;
        });
    },

    inbox: {
        conversations: [],
        clickedOpenConversation: false,
        lastLoaded: null,
        shownYet: false,
        visible: false,

        init: function() {
            chat.inbox.show(false);
        },

        initRowClicks: function() {
            $('.inboxRow').off('click touchstart').on('click touchstart', function(e) {
                if(!chat.inbox.clickedOpenConversation) {
                    chat.inbox.clickedOpenConversation = true;
                    setTimeout(function() { chat.inbox.clickedOpenConversation = false; }, 300);
                    chat.conversation.show($(this).attr('data-id'));
                }
            });
        },

        update: function() {
            var markup = chat.inbox.markup();

            $('#chatInbox').html(markup);
            chat.inbox.initRowClicks();
        },

        conversationWithId: function(conversationId) {
            for(var i=0; i<chat.inbox.conversations.length; i++) {
                if(chat.inbox.conversations[i]._id == conversationId) return chat.inbox.conversations[i];
            }

            return null;
        },

        markup: function(conversation) {
            var conversations = (typeof(conversation) === 'object') ? [conversation] : chat.inbox.conversations;

            var html = '';
            var participant;
            for(var i=0; i<conversations.length; i++) {
                conversation = conversations[i];

                html += '<div class="inbox-row inboxRow" data-id="' + conversation._id + '">';
                    html += '<div class="inbox-flex">';
                        html += '<div class="inbox-flexbox from">';
                        var listedOne = false;
                        for(var c=0; c<conversation.participants.length; c++) {
                            participant = conversation.participants[c];
                            if(participant.username != chat.user.username) {
                                if(listedOne) html += ', ';
                                html += participant.username;
                                listedOne = true;
                            }
                        }
                        html += '</div>';
                        html += '<div class="inbox-flexbox time">';
                            if(!util.is.nil(conversation.date)) {
                                if(util.time.sameDay(conversation.date, new Date())) {
                                    html += util.time.timeOfDay(conversation.date, 'HH:MM');
                                } else {
                                    html += util.time.format(conversation.date, 'MM/DD/YYYY');
                                }
                            }
                        html += '</div>';
                        html += '<div class="inbox-flexbox message" data-conversation="' + conversation._id + '">';
                            if(!util.is.nil(conversation.last) && !util.is.nil(conversation.last.message)) html +=  '<span>' + $('<div />').html(conversation.last.message).text() + '</span>'; // one here
                            else html += '<span><em>No messages yet</em></span>'
                        html += '</div>';

                        if(!util.is.nil(conversation.last) && !util.is.nil(conversation.last.seen)) {
                            var hasSeen = false;
                            for(var c=0; c<conversation.last.seen.length; c++) {
                                if(chat.user._id == conversation.last.seen[c]) {
                                    hasSeen = true;
                                    break;
                                }
                            }

                            html += '<div class="inbox-flexbox new" data-conversation="' + conversation._id + '"><a href="javascript:void(0);"><i class="fa fa-circle' + (hasSeen ? '-o' : '') + ' fa-fw" aria-hidden="true"></i></a></div>';
                        }
                    html += '</div>';
                html += '</div>';
            }

            if(conversations.length <= 0) {
                html +='<div id="noMessagesInInbox" class="background-text no-messages">You have no messages in your inbox</div>';
            } else {
                $('#noMessagesInInbox').remove();
            }

            return html;
        },

        show: function(showModal) {
            showModal = (typeof(showModal) === 'boolean') ? showModal : true;

            $('#chatConversation').stop().fadeOut(300, function() {
                $('#chatInboxWrapper').stop().fadeIn(300);
            });

            $('#chatBack').stop().fadeOut(300, function() {
                // $('#chatAdd').stop().fadeIn(300);
            });

            $('#chatInbox').addClass('loading').empty();

            if(!chat.inbox.shownYet || util.is.nil(chat.inbox.lastLoaded) || (!util.is.nil(chat.conversation.message.lastReceived) && chat.conversation.message.lastReceived > chat.inbox.lastLoaded)) {
                var request = $.ajax({
                    type: 'GET',
                    url: '/api/conversations',
                    dataType: 'json',
                    cache: false
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Error',
                        message: 'There was an error while loading your messages. You may have to refresh the page in order to load your inbox'
                    });
                });

                request.done(function(conversations) {
                    // chat.chatMarkup(conversations);
                    $('#chatInbox').removeClass('loading');
                    chat.inbox.shownYet = true;
                    chat.inbox.conversations = conversations;
                    chat.inbox.update();
                    chat.inbox.lastLoaded = new Date();
                });
            } else {
                $('#chatInbox').removeClass('loading');
                chat.inbox.update();
                chat.inbox.lastLoaded = new Date();
            }

            if(showModal) chat.show();
            chat.inbox.visible = true;
            chat.conversation.visible = false;
        },

        add: function(conversationId) {
            console.log(chat.inbox.conversations);
            // chat.inbox.conversations.push(conversationId);
            // console.log(chat.inbox.conversations);

            var request = $.ajax({
                type: 'GET',
                url: '/api/conversation/' + conversationId,
                dataType: 'json'
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
            });

            request.success(function(conversation) {
                chat.inbox.conversations.push(conversation);
                console.log(chat.inbox.conversations);

                var markup = chat.inbox.markup(conversation);

                $('#chatInbox').prepend(markup);
                chat.inbox.initRowClicks();
            });
        }
    },

    conversation: {
        conversation: null,
        lastLoaded: null,
        triggerScrollLoading: 50, // pixels
        scrollLoading: false,
        endOfConversation: false,
        lastScrollTop: -1,
        visible: false,

        init: function() {
            console.log('init chat conversation');
            $('#chatBack').on('click', function(e) {
                chat.inbox.show();
            });

            $('#chatSend').on('click', function(e) {
                chat.conversation.message.send($('#chatReply').val());
            });

            $('#chatReply').keydown(function(e) {
                var keyCode = e.keyCode || e.which;
                if(keyCode == 13 && !e.shiftKey) {
                    chat.conversation.message.send($('#chatReply').val());
                    e.preventDefault();
                }
            });

            chat.conversation.initContactAction();

            $('#chatFlow').on('scroll', function(e) {
                var scrollTop = $(this).scrollTop();
                if(scrollTop < chat.conversation.triggerScrollLoading && scrollTop < chat.conversation.lastScrollTop) {
                    chat.conversation.lastScrollTop = scrollTop;
                    chat.conversation.loadMore();
                }
            });

            chat.socket.on('message', function(message, conversationId) {
                console.log('received an emission');
                chat.conversation.message.receive(message, conversationId);
            });

            chat.socket.on('message error', function(json) {
                console.log('There was a socket messaging error');
                console.log(json);
            });

            chat.conversation.typing.init();
        },

        initContactAction: function() {
            $('.contact-action').off().on('click touchstart', function(e) {
                var ids = $(this).attr('data-ids').replace(/\s/g, '').split(',');
                chat.conversation.start(ids, $(this).attr('data-dispute') == '1');
            });
        },

        initiate: function(participants, dispute) {
            // before sending the request, make sure the message isn't already open
            participants.push(chat.user._id);

            var openParticipants = (!util.is.nil(chat.conversation.conversation)) ? chat.conversation.conversation.participants : [];
            var openParticipantIds = [];
            for(var i=0; i<openParticipants.length; i++) {
                openParticipantIds.push(openParticipants[i]._id);
            }

            if(!util.sameArray(participants, openParticipantIds, false)) {
                modal.notify({
                    title: 'Initiating Conversation',
                    message: 'We are preparing a conversation for you. This may take a few moments, so thank you for your patience.',
                    canOkay: false,
                    canExit: false
                });

                var body = {
                    participants: participants,
                    dispute: dispute
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/conversation/start',
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    if(jqXHR.status == 404) {
                        modal.notify({
                            title: 'Whoops!',
                            message: 'It looks like the user(s) you are trying to contact no longer has an account with us. If you have encountered this issue erroneously, please contact us for more information.'
                        });
                    } else {
                        modal.notify({
                            title: 'Error',
                            message: 'There was an error while loading your conversation. You may have to refresh the page and try again.'
                        });
                    }
                });

                request.done(function(conversation) {
                    chat.conversation.show(conversation._id, conversation);
                    modal.hide(null, true);
                });
            } else {
                chat.conversation.show(chat.conversation.conversation._id, chat.conversation.conversation);
            }
        },

        start: function(participants, dispute) {
            dispute = (typeof(dispute) === 'boolean') ? dispute : false;

            if(dispute) {
                modal.confirm({
                    title: 'Resolution Request',
                    message: 'You are about to open a three-way conversation between you, the other party involved, and MechFinder support where we will do our best to resolve anything that you need help with. Would you like to continue?',
                    yes: function() {
                        chat.conversation.initiate(participants, dispute);
                    }
                });
            } else {
                chat.conversation.initiate(participants, dispute);
            }
        },

        typing: {
            time: 1000,
            emit: true,
            timeout: null,

            init: function() {
                console.log('init chat conversation typing');
                chat.socket.on('typing', function(userId, conversationId) {
                    chat.conversation.typing.receive(userId, conversationId);
                });

                $('#chatReply').keydown(function(e) {
                    var keyCode = e.keyCode || e.which;
                    if(chat.conversation.typing.emit && keyCode != 13) {
                        chat.conversation.typing.emit = false;
                        setTimeout(function() { chat.conversation.typing.emit = true; }, chat.conversation.typing.time);

                        var parts = [];
                        for(var i = 0; i<chat.conversation.conversation.participants.length; i++) {
                            parts.push(chat.conversation.conversation.participants[i]._id);
                        }

                        chat.socket.emit('typing', parts, chat.conversation.conversation._id);
                    }
                });
            },

            receive: function(userId, conversationId) {
                if(!util.is.nil(chat.conversation.conversation) && conversationId == chat.conversation.conversation._id && chat.user._id != userId) {
                    var participant;
                    for(var i=0; i<chat.conversation.conversation.participants.length; i++) {
                        participant = chat.conversation.conversation.participants[i];
                        if(participant._id == userId) {
                            chat.conversation.typing.update(participant.username + ' is typing...');
                            break;
                        }
                    }

                    clearTimeout(chat.conversation.typing.timeout);
                    chat.conversation.typing.timeout = setTimeout(function() {
                        chat.conversation.typing.update('');
                    }, chat.conversation.typing.time * 2);
                }
            },

            update: function(message, error) {
                error = (typeof(error) === 'boolean') ? error : false;
                message = (util.is.nil(message)) ? '&nbsp;' : message;

                if(message != $('#chatTyping').html()) {
                    $('#chatTyping').stop().fadeTo(300, 0, function() {
                        if(error) $(this).addClass('error');
                        else $(this).removeClass('error');

                        $(this).html(message).fadeTo(300, 1);
                    });
                }
            }
        },

        show: function(conversationId, conversation) {
            $('#chatInboxWrapper').stop().fadeOut(300, function() {
                $('#chatConversation').stop().fadeIn(300);
            });

            // $('#chatAdd').stop().fadeOut(300, function() {
                $('#chatBack').stop().fadeIn(300);
            // });

            $('#chatFlow').addClass('loading').empty();

            if(util.is.nil(conversation) && !util.is.nil(chat.conversation.conversation) && chat.conversation.conversation._id == conversationId) {
                conversation = chat.conversation.conversation;
            }

            if(util.is.nil(conversation)) {
                var request = $.ajax({
                    type: 'GET',
                    url: '/api/conversation/' + conversationId,
                    dataType: 'json',
                    cache: false
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Error',
                        message: 'There was an error while loading your messages. You may have to refresh the page in order to load your inbox'
                    });
                });

                request.done(function(conversation) {
                    console.log('done');
                    chat.conversation.conversation = conversation;
                    chat.conversation.update();
                    chat.conversation.see(conversation._id, conversation.messages);
                    $('#chatFlow').removeClass('loading');

                    chat.conversation.lastLoaded = new Date();
                    chat.conversation.endOfConversation = false;
                });
            } else {
                chat.conversation.conversation = conversation;
                chat.conversation.update();
                chat.conversation.see(conversation._id, conversation.messages);
                $('#chatFlow').removeClass('loading');
            }

            chat.show(); // show the chat if it's not already showing
            chat.inbox.visible = false;
            chat.conversation.visible = true;
        },

        see: function(conversationId, messages, forceLastMessage) {
            forceLastMessage = (typeof(forceLastMessage) === 'boolean') ? forceLastMessage : true;

            // set the last message of the clicked conv to seen (for inbox)
            var ic = chat.inbox.conversationWithId(conversationId);
            if(!util.is.nil(ic) && !util.is.nil(ic.last) && !util.is.nil(ic.last.seen)) {
                var alreadyMarked;
                var participant;
                for(var i=0; i<ic.last.seen.length; i++) {
                    participantId = ic.last.seen[i];
                    if(participantId == chat.user._id) {
                        alreadyMarked = true;
                        break;
                    }
                }

                if(!alreadyMarked) {
                    ic.last.seen.push(chat.user._id);
                }
            }

            var message;
            var seen;
            var unseen = false;

            var inSeen = false;
            for(var i=0; i<messages.length; i++) {
                message = messages[i];

                inSeen = false;
                for(var c=0; c<message.seen.length; c++) {
                    seen = message.seen[c];
                    if(seen == chat.user._id) {
                        inSeen = true;
                        break;
                    }
                }

                if(!inSeen) {
                    unseen = true;
                    break;
                }
            }

            var selector = '.inbox-flexbox.new[data-conversation="' + conversationId + '"] i.fa';
            $(selector).removeClass('fa-circle').addClass('fa-circle-o');

            if(unseen && chat.conversation.visible && chat.visible) {
                var startId = messages[0]._id;
                var endId = messages[messages.length-1]._id;

                var body = {
                    conversationId: conversationId,
                    startId: startId,
                    endId: endId,
                    forceLastMessage: forceLastMessage
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/conversation/see',
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                });

                request.success(function(data) {
                    console.log(data);
                });
            }
        },

        update: function() {
            var markup = chat.conversation.markup();
            $('#chatFlow').html(markup);
            $('#chatInboxWrapper').stop().fadeOut(300, function() {
                $('#chatConversation').stop().fadeIn(300);
                chat.conversation.scrollBottom();
            });
        },

        markup: function() {
            var html = '';
            var message;
            var mine = false;

            var lastMessageUserId = '';
            for(var i=0; i<chat.conversation.conversation.messages.length; i++) {
                message = chat.conversation.conversation.messages[i];
                mine = (message.from._id == chat.user._id);
                var whos = mine ? 'my' : 'their';
                if(whos != 'my' && message.from.role == 'support') whos = 'mf';

                var repeatUser = false;
                if(!util.is.nil(lastMessageUserId)) {
                    repeatUser = (message.from._id == lastMessageUserId);
                }

                html += '<div class="' + whos + '-message">';
                    html += '<div class="profile-row"' + ((repeatUser) ? ' style="display: none;"' : '') + '>';
                        html += '<div class="message-flex">';

                            if(!mine && !util.is.nil(message.from.picture))
                                html += '<div class="message-flexbox profile-circle" style="background-image: url(\'/api/public/image/' + message.from.picture + '\');"></div>';


                            html += '<div class="message-flexbox profile-name">';
                                html += (mine) ? 'You' : message.from.username;

                                switch(message.from.role) {
                                    case 'buyer':
                                        html += ' (Customer)';
                                        break;
                                    case 'seller':
                                        html += ' (Mechanic)';
                                        break;
                                    case 'support':
                                        html += ' Support';
                                        break;
                                }

                                var dayFormat = (util.time.sameDay(message.time, new Date())) ? 'Today' : util.time.format(message.time, 'MM/DD/YYYY');
                                html += ' <strong>' + dayFormat + ' at ' + util.time.timeOfDay(message.time) + '</strong>';
                            html += '</div>';

                            if(mine && !util.is.nil(message.from.picture))
                                html += '<div class="message-flexbox profile-circle" style="background-image: url(\'/api/public/image/' + message.from.picture + '\');"></div>';

                        html += '</div>';
                    html += '</div>';
                    html += '<div class="bubble-row">';
                        // html += '<div class="message-bubble">' + $('<div />').html(message.message).text() + '</div>'; // one here
                        html += '<div class="message-bubble">' + message.message + '</div>'; // one here
                    html += '</div>';
                html += '</div>';

                lastMessageUserId = message.from._id;
            }

            if(chat.conversation.conversation.messages.length <= 0) {
                html +='<div id="noMessagesInFlow" class="background-text no-messages">You have no messages yet. Let the conversation begin!</div>';
            } else {
                $('#noMessagesInFlow').remove();
            }

            html += '<div id="chatReplyBlocker" class="reply-blocker"></div>';

            return html;
        },

        toast: function(message) {
            if(!util.is.nil(message)) {
                $('#chatToast').stop().hide();
                $('#chatToastMessage').html(message);
                $('#chatToast').stop().fadeIn(300);
            } else {
                $('#chatToast').stop().fadeOut(300);
            }
        },

        loadMore: function() {
            if(!chat.conversation.scrollLoading && !chat.conversation.endOfConversation && !util.is.nil(chat.conversation.conversation)) {
                chat.conversation.scrollLoading = true;

                var cid = chat.conversation.conversation._id;
                var skip = chat.conversation.conversation.messages.length;

                chat.conversation.toast('Loading more messages...');

                var request = $.ajax({
                    type: 'GET',
                    url: '/api/conversation/messages/' + cid + '/' + skip,
                    dataType: 'json',
                    cache: false
                });

                request.fail(function(jqXHR) {
                    console.log('cannot load any more messages');
                    chat.conversation.toast('There was a problem while loading your messages...');
                });

                request.done(function(data) {
                    var messages = data.messages;
                    if(data.end || messages.length == 0) chat.conversation.endOfConversation = true;

                    var osh = $('#chatFlow')[0].scrollHeight;
                    var ost = $('#chatFlow').scrollTop();

                    var message;
                    for(var i=0; i<messages.length; i++) {
                        message = messages[i];
                        chat.conversation.conversation.messages.unshift(message);
                        var markup = chat.conversation.message.markup(message, false);
                        $('#chatFlow').prepend(markup);
                    }

                    var nsh = $('#chatFlow')[0].scrollHeight;
                    var nst = nsh - osh + ost;
                    $('#chatFlow').scrollTop(nst);
                    chat.conversation.lastScrollTop = nst;

                    chat.conversation.scrollLoading = false;
                    chat.conversation.toast('');
                });
            }
        },

        message: {
            lastReceived: null,

            send: function(message) {
                if(!util.is.nil(message) && message != '\n') {
                    // message = $('<div />').html(message).text();

                    var parts = [];
                    var participant;

                    for(var i = 0; i<chat.conversation.conversation.participants.length; i++) {
                        participant = chat.conversation.conversation.participants[i];
                        if(typeof(participant) === 'string') {
                            parts.push(participant);
                        } else {
                            parts.push(participant._id);
                        }
                    }

                    chat.socket.emit('message', message, parts, chat.conversation.conversation._id);
                }

                $('#chatReply').val('');
            },

            receive: function(message, conversationId) {
                console.log('received');
                if(!util.is.nil(chat.conversation.conversation) && conversationId == chat.conversation.conversation._id) {
                    console.log('conversation is visible');
                    $('#chatReplyBlocker').remove();

                    chat.conversation.conversation.messages.push(message);
                    var markup = chat.conversation.message.markup(message);
                    $('#chatFlow').append(markup);
                    chat.conversation.typing.update('');
                    chat.conversation.scrollBottom();

                    chat.conversation.see(conversationId, [message]); // send it to the conversation see api in the background
                    chat.conversation.conversation.last = message;
                }

                if(!chat.conversation.visible || !chat.visible || conversationId != chat.conversation.conversation._id) {
                    // chat is not on the conversation
                    console.log('Need to update the inbox');

                    // determine if it is a new conversation
                    var conversation = null;
                    for(var i=0; i<chat.inbox.conversations.length; i++) {
                        if(conversationId == chat.inbox.conversations[i]._id) {
                            // not a new conversation
                            conversation = chat.inbox.conversations[i];
                            break;
                        }
                    }

                    if(util.is.nil(conversation)) {
                        // it is a new conversation
                        console.log('New conversation! Prepend the row');
                        chat.inbox.add(conversationId);
                    } else {
                        // it is an existing conversation
                        console.log('Need to update a row in the inbox');

                        // $('.inboxRow[data-id="' + conversation._id + '"]').css({'background': 'blue'});
                        $('.inbox-flexbox.new[data-conversation="' + conversation._id + '"] i.fa').removeClass('fa-circle-o').addClass('fa-circle');
                        $('.inbox-flexbox.message[data-conversation="' + conversation._id + '"] span').fadeTo(300, 0, function() {
                            $(this).html(message.message).fadeTo(300, 1);
                        });
                    }
                }


                $('#noMessagesInFlow').remove();
                chat.conversation.message.lastReceived = new Date();
            },

            markup: function(message, blocker) {
                blocker = (typeof(blocker) === 'boolean') ? blocker : true;

                var html = '';
                var mine = (message.from._id == chat.user._id);
                var whos = mine ? 'my' : 'their';
                if(whos != 'my' && message.from.role == 'support') whos = 'mf';

                var repeatUser = false;
                if(chat.conversation.conversation.messages.length >= 2) {
                    var length = chat.conversation.conversation.messages.length;
                    var lastUserId = chat.conversation.conversation.messages[length - 2].from._id;
                    repeatUser = (message.from._id == lastUserId);
                }

                html += '<div class="' + whos + '-message">';
                    html += '<div class="profile-row"' + ((repeatUser) ? ' style="display: none;"' : '') + '>';
                        html += '<div class="message-flex">';

                            if(!mine && !util.is.nil(message.from.picture))
                                html += '<div class="message-flexbox profile-circle" style="background-image: url(\'/api/public/image/' + message.from.picture + '\');"></div>';

                            html += '<div class="message-flexbox profile-name">';
                                html += (mine) ? 'You' : message.from.username;

                                switch(message.from.role) {
                                    case 'buyer':
                                        html += ' (Customer)';
                                        break;
                                    case 'seller':
                                        html += ' (Mechanic)';
                                        break;
                                    case 'support':
                                        html += ' Support';
                                        break;
                                }

                                var dayFormat = (util.time.sameDay(message.time, new Date())) ? 'Today' : util.time.format(message.time, 'MM/DD/YYYY');
                                html += ' <strong>' + dayFormat + ' at ' + util.time.timeOfDay(message.time) + '</strong>';
                            html += '</div>';

                            if(mine && !util.is.nil(message.from.picture))
                                html += '<div class="message-flexbox profile-circle" style="background-image: url(\'/api/public/image/' + message.from.picture + '\');"></div>';

                        html += '</div>';
                    html += '</div>';
                    html += '<div class="bubble-row">';
                        // html += '<div class="message-bubble">' + $('<div />').html(message.message).text() + '</div>'; // on here
                        html += '<div class="message-bubble">' + message.message + '</div>'; // on here
                    html += '</div>';
                html += '</div>';
                if(blocker) html += '<div id="chatReplyBlocker" class="reply-blocker"></div>';

                return html;
            }
        },

        scrollBottom: function() {
            var height = $('#chatFlow')[0].scrollHeight;
            $('#chatFlow').scrollTop(height);
            chat.conversation.lastScrollTop = $('#chatFlow').scrollTop();
        }
    },
}

$(document).ready(function(e) {
    chat.init();
});
