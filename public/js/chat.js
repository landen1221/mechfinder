var chat = {
    user: null,
    socket: null,

    exitable: false,
    visible: false,

    open: null,
    contactAction: null,

    audio: {
        play: function() {
            console.log('Audio is not supported in this browser');
        }
    },

    init: function() {
        chat.user = USER;
        chat.initSocket();

        var a = document.createElement('audio');
        if(a.canPlayType) {
            chat.audio = new Audio('/static/audio/ping.wav');
        }

        $('#chat, #chatExit').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove') {
                chat.hide();
            }
        });

        $('#chatContainer').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove') {
                e.stopPropagation();
            }
        });

        $('.openChat').on('click', function(e) {
            chat.show();
        });

        $('#chatSound').on('click', function(e) {
            chat.toggleSound();
        });

        var urlConversation = util.url.paramsToObject()['conversationId'];
        if(!util.is.nil(urlConversation)) {
            chat.open = urlConversation;
            modal.notify({
                title: 'Loading Messages',
                message: 'We are loading your conversation. This may take a few moments.',
                loading: true
            });
        }

        var urlContactAction = util.url.paramsToObject()['contactAction'];
        if(!util.is.nil(urlContactAction)) {
            chat.contactAction = urlContactAction.split(',');
            modal.notify({
                title: 'Loading Messages',
                message: 'We are loading your conversation. This may take a few moments.',
                loading: true
            });
        }
    },

    initSocket: function() {
        if(typeof(io) !== 'undefined') {
            chat.socket = io();
            chat.hook.init();
            chat.conversations.init();
            chat.scroll.init();
            chat.sup.init();
            chat.message.init();
            chat.typing.init();
        } else {
            setTimeout(function() {
                chat.initSocket();
            }, 500);
        }
    },

    toggleSound: function() {
        console.log('toggling sound');

        var enable = !($('#chatSound').attr('data-enabled') == 1);
        $('#chatSound').attr('data-enabled', (enable ? '1' : '0'));
        $('#chatSound i').removeClass('fa-volume-' + (enable ? 'off' : 'up')).addClass('fa-volume-' + (enable ? 'up' : 'off'));
        chat.user.preferences.chat.sound = enable;

        var body = {
            preferences: {
                chat: {
                    sound: enable
                }
            }
        };

        var request = $.ajax({
            method: 'POST',
            url: '/api/profile',
            data: body,
            dataType: 'json'
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
        });
    },

    show: function() {
        chat.exitable = false;
        $('#chat').stop().fadeIn(300, function() {
            // post show stuff here
            chat.exitable = true;
            chat.visible = true;
        });

        if(chat.conversations.flow.visible) {
            chat.conversations.flow.scrollDown();
            var seen = chat.conversations.see(chat.conversations.flowed);
            chat.sup.update(-seen);
        }
    },

    hide: function() {
        if(chat.exitable) {
            $('#chat').stop().fadeOut(300, function() {
                chat.visible = false;
            });
        }
    },

    hook: {
        init: function() {
            chat.hook.initClicks();
        },

        initClicks: function() {
            $('.contact-action').off().on('click touchstart', function(e) {
                var ids = $(this).attr('data-ids').replace(/\s/g, '').split(',');
                chat.conversations.start(ids, $(this).attr('data-dispute') == '1');
            });
        }
    },

    // support old hooks as well
    conversation: {
        initContactAction: function() {
            chat.hook.initClicks();
        }
    },

    conversations: {
        list: [],
        flowed: -1,

        id: function(id, index) {
            index = (typeof index === 'boolean') ? index : true;

            for(var i=0; i<chat.conversations.list.length; i++) {
                if(chat.conversations.list[i]._id == id) 
                    return (index) ? i : chat.conversations.list[i];
            }

            return -1;
        },

        init: function() {
            chat.conversations.load(function(conversations) {
                chat.conversations.list = conversations;
                chat.conversations.inbox.init();
                chat.conversations.flow.init();

                var unseen = 0;
                for(var i=0; i<conversations.length; i++) {
                    unseen += chat.conversations.unseen(conversations[i]);
                }

                chat.sup.update(unseen, false);

                if(!util.is.nil(chat.open)) {
                    var index = chat.conversations.id(chat.open);
                    modal.hide(null, true);

                    if(index >= 0) {
                        chat.conversations.flow.show(index);
                        chat.show();
                    }
                }

                if(!util.is.nil(chat.contactAction)) {
                    chat.conversations.start(chat.contactAction);
                }
            });
        },

        initiate: function(participants, dispute) {
            // before sending the request, make sure the message isn't already open
            participants.push(chat.user._id);

            var openParticipants = (chat.conversations.flowed >= 0) ? chat.conversations.list[chat.conversations.flowed].participants : [];
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
                    modal.hide(null, true);

                    var index = chat.conversations.id(conversation._id);
                    if(index < 0) {
                        index = chat.conversations.list.length;
                        chat.conversations.list.push(conversation);
                    }

                    chat.show();
                    chat.conversations.flow.show(index);
                });
            } else {
                console.log(chat.conversations.flowed);
                chat.show();
                chat.conversations.flow.show(chat.conversations.flowed);
            }
        },
        
        start: function(participants, dispute) {
            dispute = (typeof(dispute) === 'boolean') ? dispute : false;

            if(dispute) {
                modal.confirm({
                    title: 'Resolution Request',
                    message: 'You are about to open a three-way conversation between you, the other party involved, and MechFinder support where we will do our best to resolve anything that you need help with. Would you like to continue?',
                    yes: function() {
                        chat.conversations.initiate(participants, true);
                    }
                });
            } else {
                chat.conversations.initiate(participants, false);
            }
        },

        unseen: function(conversation) {
            var message;
            var unread = 0;
            for(var i=0; i<conversation.messages.length; i++) {
                message = conversation.messages[i];
                if(!util.within(message.seen, chat.user._id)) {
                    unread++;
                }
            }

            return unread;
        },

        see: function(index) {
            var seen = 0;
            for(var i=0; i<chat.conversations.list[index].messages.length; i++) {
                if(!util.within(chat.conversations.list[index].messages[i].seen, chat.user._id)) {
                    chat.conversations.list[index].messages[i].seen.push(chat.user._id);
                    seen++;
                }
            }

            chat.conversations.list[index].last.seen.push(chat.user._id);

            if(seen > 0) {
                var len = chat.conversations.list[index].messages.length;
                var conversationId = chat.conversations.list[index]._id;
                var startId = chat.conversations.list[index].messages[len - 1]._id;
                var endId = chat.conversations.list[index].messages[0]._id;

                var body = {
                    conversationId: conversationId,
                    startId: startId,
                    endId: endId,
                    forceLastMessage: true
                };

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/conversation/see',
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                });
            }

            return seen;
        },

        load: function(next) {
            var request = $.ajax({
                type: 'GET',
                url: '/api/conversations',
                dataType: 'json'
            });

            request.success(function(data) {
                next(data);
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
            });
        },

        inbox: {
            visible: true,
            clicked: false,
            
            init: function() {

                // load the inbox markup
                var markup = chat.conversations.inbox.generateMarkup(chat.conversations.list);
                chat.conversations.inbox.setMarkup(markup);
                chat.conversations.inbox.initClicks();
            },

            show: function() {
                chat.conversations.inbox.visible = true;
                chat.conversations.flow.visible = false;
                $('#chatConversation').stop().fadeOut(300, function() {
                    $('#chatInboxWrapper').stop().fadeIn(300);
                });

                $('#chatBack').stop().fadeOut(300);
            },

            initClicks: function() {
                $('.inboxRow').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                    if(!chat.conversations.inbox.clicked && e.type !== 'touchend') {
                        chat.conversations.inbox.clicked = true;
                        setTimeout(function() {
                            chat.conversations.inbox.clicked = false;
                        }, 300);

                        var dataId = $(this).data('id');
                        var index = chat.conversations.id(dataId);
                        $('#inboxNew'+dataId + ' .fa').removeClass('fa-circle').addClass('fa-circle-o');
                        chat.conversations.flow.show(index);
                    }
                });
            },

            update: function(index) {
                var conversation = chat.conversations.list[index];

                if(!$('#inboxRow' + conversation._id).length) {
                    chat.conversations.inbox.prependConversation(index);
                }
                
                var inboxTime = '';
                if(util.time.sameDay(conversation.date, new Date())) inboxTime = util.time.timeOfDay(conversation.date, 'HH:MM');
                else inboxTime = util.time.format(conversation.date, 'MM/DD/YYYY');
                $('#inboxTime' + conversation._id).html(inboxTime);

                $('#inboxMessage' + conversation._id).html(conversation.last.message);

                // determine if flow is not open with received convo
                if(!(chat.visible && chat.conversations.flow.visible && chat.conversations.flowed == index)) {
                    $('#inboxNew'+conversation._id + ' .fa').removeClass('fa-circle-o').addClass('fa-circle');
                }
            },

            prependConversation: function(index) {
                var conversation = chat.conversations.list[index];
                var markup = chat.conversations.inbox.generateMarkup(conversation);
                $('#chatInbox').prepend(markup);
                chat.conversations.inbox.initClicks();
            },

            setMarkup: function(markup) {
                $('#chatInbox').html(markup);
            },

            generateMarkup: function(conversations) {
                conversations = (util.is.array(conversations)) ? conversations : [conversations];

                if(conversations.length < 1) {
                    return '<div id="noMessagesInInbox" class="background-text no-messages">You have no messages in your inbox</div>';
                } else {
                    $('#noMessagesInInbox').remove();
                    
                    var conversation;
                    var html = '';
                    
                    for(var i=0; i<conversations.length; i++) {
                        conversation = conversations[i];

                        html += '<div id="inboxRow' + conversation._id + '" class="inbox-row inboxRow" data-id="' + conversation._id + '">';
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
                                html += '<div id="inboxTime' + conversation._id + '" class="inbox-flexbox time">';
                                    if(!util.is.nil(conversation.date)) {
                                        if(util.time.sameDay(conversation.date, new Date())) {
                                            html += util.time.timeOfDay(conversation.date, 'HH:MM');
                                        } else {
                                            html += util.time.format(conversation.date, 'MM/DD/YYYY');
                                        }
                                    }
                                html += '</div>';
                                html += '<div id="inboxMessage' + conversation._id + '" class="inbox-flexbox message" data-conversation="' + conversation._id + '">';
                                    if(!util.is.nil(conversation.last) && !util.is.nil(conversation.last.message)) html +=  '<span>' + $('<div />').html(conversation.last.message).text() + '</span>'; // one here
                                    else html += '<span><em>No messages yet</em></span>'
                                html += '</div>';

                                var seen = (util.within(conversation.last.seen, chat.user._id));
                                html += '<div id="inboxNew' + conversation._id + '" class="inbox-flexbox new" data-conversation="' + conversation._id + '"><a href="javascript:void(0);"><i class="fa fa-circle' + (seen ? '-o' : '') + ' fa-fw" aria-hidden="true"></i></a></div>';
                            html += '</div>';
                        html += '</div>';
                    }

                    return html;
                }
            }
        },

        flow: {
            visible: false,
            scrollThreshold: 50,
            lastScrollTop: 0,

            init: function() {
                $('#chatSend').on('click', function(e) {
                    chat.message.send($('#chatReply').val());
                });

                $('#chatReply').keydown(function(e) {
                    var keyCode = e.keyCode || e.which;
                    if(keyCode == 13 && !e.shiftKey) {
                        chat.message.send($('#chatReply').val());
                        e.preventDefault();
                    }
                });

                $('#chatBack').on('click', function(e) {
                    chat.conversations.inbox.show();
                });
            },

            show: function(index) {
                if(index >= 0) {
                    chat.conversations.flowed = index;
                    var conversation = chat.conversations.list[chat.conversations.flowed];

                    var markup = chat.conversations.flow.generateMarkup(conversation)
                    chat.conversations.flow.setMarkup(markup);

                    chat.conversations.inbox.visible = false;
                    chat.conversations.flow.visible = true;
                    $('#chatInboxWrapper').stop().fadeOut(300, function() {
                        $('#chatConversation').stop().fadeIn(300);
                        chat.conversations.flow.scrollDown();
                    });

                    $('#chatBack').stop().fadeIn(300);

                    var seen = chat.conversations.see(chat.conversations.flowed);
                    chat.sup.update(-seen);
                }
            },

            scrollDown: function() {
                var height = $('#chatFlow')[0].scrollHeight;
                $('#chatFlow').scrollTop(height);
                
                chat.scroll.lastScrollTop = $('#chatFlow').scrollTop();
            },

            setMarkup: function(markup) {
                $('#chatFlow').html(markup);
            },

            generateMarkup: function(conversation) {
                var html = '';
                if(conversation.messages.length > 0) {
                    var html = '';
                    var message;
                    var lastMessage = null;
                    var sameFrom = false;
                    for(var i=0; i<conversation.messages.length; i++) {
                        message = conversation.messages[i];
                        
                        if(!util.is.nil(lastMessage) && message.from._id == lastMessage.from._id) sameFrom = true;
                        else sameFrom = false;
                        
                        lastMessage = message;
                        html += chat.message.generateMarkup(message, sameFrom);
                    }

                    html += '<div id="chatReplyBlocker" class="reply-blocker"></div>';
                } else {
                    html += '<div id="noMessagesInFlow" class="background-text no-messages">You have no messages yet. Let the conversation begin!</div>';
                }
                
                return html;
            },

            appendMessage: function(message) {
                var conversation = chat.conversations.list[chat.conversations.flowed];
                var len = conversation.messages.length;

                var repeatUser = false;
                if(len > 1) {
                    var lastMessage = conversation.messages[len - 2];
                    if(message.from._id == lastMessage.from._id) repeatUser = true;
                }

                var markup = chat.message.generateMarkup(message, repeatUser);
                markup += '<div id="chatReplyBlocker" class="reply-blocker"></div>';

                $('#chatReplyBlocker').remove();
                $('#chatFlow').append(markup);
                $('#noMessagesInFlow').remove();
                
            }
        }
    },

    scroll: {
        trigger: 50, // pixels
        lastScrollTop: -1,
        end: false,
        loading: false,

        init: function() {
            $('#chatFlow').on('scroll', function(e) {
                var scrollTop = $(this).scrollTop();
                if(scrollTop < chat.scroll.trigger && scrollTop < chat.scroll.lastScrollTop) {
                    chat.scroll.lastScrollTop = scrollTop;
                    chat.scroll.load();
                }
            });
        },

        load: function() {
            if(!chat.scroll.loading && !chat.scroll.end && chat.conversations.flowed >= 0) {
                chat.scroll.loading = true;

                var cid = chat.conversations.list[chat.conversations.flowed]._id;
                var skip = chat.conversations.list[chat.conversations.flowed].messages.length;

                chat.toast('Loading more messages...');

                var request = $.ajax({
                    type: 'GET',
                    url: '/api/conversation/messages/' + cid + '/' + skip,
                    dataType: 'json',
                    cache: false
                });

                request.fail(function(jqXHR) {
                    chat.toast('There was a problem while loading your messages...');
                });

                request.done(function(data) {
                    var messages = data.messages;
                    if(data.end || messages.length == 0) {
                        chat.scroll.end = true;
                        chat.toast('No more messages to load', 1500);
                    } else {
                        chat.toast('');
                    }

                    var osh = $('#chatFlow')[0].scrollHeight;
                    var ost = $('#chatFlow').scrollTop();

                    var message;
                    var prevMessage = null;
                    var sameFrom = false;
                    for(var i=0; i<messages.length; i++) {
                        message = messages[i];

                        if(i < messages.length - 1) prevMessage = messages[i+1];
                        else prevMessage = null;

                        if(!util.is.nil(prevMessage) && prevMessage.from._id == message.from._id) sameFrom = true;
                        else sameFrom = false;

                        chat.conversations.list[chat.conversations.flowed].messages.unshift(message);
                        var markup = chat.message.generateMarkup(message, sameFrom);
                        $('#chatFlow').prepend(markup);
                    }

                    var nsh = $('#chatFlow')[0].scrollHeight;
                    var nst = nsh - osh + ost;
                    $('#chatFlow').scrollTop(nst);
                    chat.scroll.lastScrollTop = nst;

                    chat.scroll.loading = false;
                });
            }
        }
    },

    toast: function(message, fadeOut) {
        fadeOut = (typeof fadeOut === 'number') ? fadeOut : 0;

        if(!util.is.nil(message)) {
            $('#chatToast').stop().hide();
            $('#chatToastMessage').html(message);
            $('#chatToast').stop().fadeIn(300, function() {
                if(fadeOut > 0) {
                    setTimeout(function() {
                        $('#chatToast').stop().fadeOut(300);
                    }, fadeOut);
                }
            });
        } else {
            $('#chatToast').stop().fadeOut(300);
        }
    },

    sup: {
        unseen: 0,
        init: function() {
        },

        update: function(n, relative) {
            relative = (typeof relative === 'boolean') ? relative : true;

            if(relative) chat.sup.unseen += n;
            else chat.sup.unseen = n;

            $('#chatSup').stop().fadeOut(300, function() {
                if(chat.sup.unseen > 0) {
                    $(this).html(chat.sup.unseen).stop().fadeIn(300);
                } else {
                    chat.sup.unseen = 0;
                }
            });
        }
    },

    message: {
        init: function() {
            chat.socket.on('message', function(message, conversationId) {
                chat.message.receive(message, conversationId);
            });
        },

        send: function(message) {
            var emailExp = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/img;
            var phoneExp = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/img;

            var emailWithin = false;
            var phoneWithin = false;

            var beforeEmailCheck = message;
            message = message.replace(emailExp, '********');
            emailWithin = (message != beforeEmailCheck) 
            
            var beforePhoneCheck = message;
            message = message.replace(phoneExp, '##########');
            phoneWithin = (message != beforePhoneCheck);
            
            var toastString = 'Including email addresses or phone numbers violates our <a href="/terms/" target="_blank">Terms of Service</a>. Your message has been sent with your ';
            if(emailWithin) toastString += 'email address';
            if(emailWithin && phoneWithin) toastString += ' and phone number';
            if(!emailWithin && phoneWithin) toastString += 'phone number';
            toastString += ' hidden';

            if(emailWithin || phoneWithin) chat.toast(toastString, 5000);

            if(!util.is.nil(message) && message != '\n') {
                var conversation = chat.conversations.list[chat.conversations.flowed];
                var parts = [];
                var participant;
                for(var i = 0; i<conversation.participants.length; i++) {
                    participant = conversation.participants[i];
                    parts.push(participant._id);
                }

                console.log('about to send parts: ')
                console.log(parts);

                chat.socket.emit('message', message, parts, conversation._id);
            }

            $('#chatReply').val('');
        },

        receive: function(message, conversationId) {
            console.log('received message: ' + message.message);

            var index = chat.conversations.id(conversationId);
            console.log('received message for conversation index: ' + index);
            console.log('flowed conversation: ' + chat.conversations.flowed);
            if(index >= 0) {
                chat.conversations.list[index].messages.push(message);
                chat.conversations.list[index].last = message;
                chat.conversations.list[index].date = new Date();

                var conversationFlowed = (index == chat.conversations.flowed);

                // update the conv bubbles
                // if received conv is being viewed
                if(conversationFlowed) {
                    chat.conversations.flow.appendMessage(message);
                    chat.conversations.flow.scrollDown();
                }

                if((!chat.visible || !chat.conversations.flow.visible || !conversationFlowed) && message.from._id != chat.user._id && chat.user.preferences.chat.sound) {
                    console.log('gonna now play the chat sound');
                    chat.audio.play();
                }

                // update nav unread message count
                // unless conv is in view
                if(!(conversationFlowed && chat.visible && chat.conversations.flow.visible)) {
                    chat.sup.update(1);
                }

                // update the inbox row for this conv - inbox time inbox message inbox new + id
                chat.conversations.inbox.update(index);
            } else {
                // new conversation
                console.log('this is a new conversation to us');
                var request = $.ajax({
                    type: 'GET',
                    url: '/api/conversation/' + conversationId,
                    dataType: 'json'
                });

                request.done(function(conversation) {
                    var previousLength = chat.conversations.list.length;
                    chat.conversations.list.push(conversation);
                    chat.conversations.inbox.prependConversation(previousLength);
                    chat.sup.update(1);

                    if(message.from._id != chat.user._id && chat.user.preferences.chat.sound) {
                        console.log('gonna play the sound');
                        chat.audio.play();
                    }
                });
            }
        },

        generateMarkup: function(message, repeatUser) {
            repeatUser = (typeof repeatUser === 'boolean') ? repeatUser : false;
            
            var html = '';
            var mine = (message.from._id == chat.user._id);
            var whos = mine ? 'my' : 'their';
            if(whos != 'my' && message.from.role == 'support') whos = 'mf';

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
                    html += '<div class="message-bubble">' + $('<div />').html(message.message).text() + '</div>';
                html += '</div>';
            html += '</div>';

            return html;
        }
    },

    typing: {
        time: 1000,
        emit: true,
        timeout: null,

        init: function() {
            console.log('init chat conversation typing');
            chat.socket.on('typing', function(userId, conversationId) {
                chat.typing.receive(userId, conversationId);
            });

            $('#chatReply').keydown(function(e) {
                var keyCode = e.keyCode || e.which;
                if(chat.typing.emit && keyCode != 13) {
                    console.log('typing');
                    chat.typing.emit = false;
                    setTimeout(function() { chat.typing.emit = true; }, chat.typing.time);

                    var conversation = chat.conversations.list[chat.conversations.flowed];
                    var parts = [];
                    for(var i = 0; i<conversation.participants.length; i++) {
                        parts.push(conversation.participants[i]._id);
                    }

                    chat.socket.emit('typing', parts, conversation._id);
                }
            });
        },

        receive: function(userId, conversationId) {
            var index = chat.conversations.id(conversationId);

            if(index == chat.conversations.flowed && chat.user._id !== userId && chat.visible && chat.conversations.flow.visible) {
                var conversation = chat.conversations.list[index];
                var participant;
                for(var i=0; i<conversation.participants.length; i++) {
                    participant = conversation.participants[i];
                    if(participant._id == userId) {
                        chat.typing.update(participant.username + ' is typing...');
                        break;
                    }
                }

                clearTimeout(chat.typing.timeout);
                chat.typing.timeout = setTimeout(function() {
                    chat.typing.update('');
                }, chat.typing.time * 2);
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
};

$(document).ready(function() {
    chat.init();
});