const botgram = require("botgram");
const bot = botgram("-----"); // SET BOT TOKEN HERE
const Low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const Adapter = new FileSync("usersdb.json");
const user_db = Low(Adapter);
const abiDecoder = require("abi-decoder");
const buy =
  "(https://app.uniswap.org/#/swap?outputCurrency=0x3a1c1d1c06be03cddc4d3332f7c20e1b37c97ce9)";
const fetch = require("node-fetch");

//admin IDs for admin commands
admin_ID1 = 0; //SET UUID HERE
admin_ID2 = 0; //SET UUID HERE

//POT DETAILS
const potSeed = "---- "; // GENERATE ETH WALLET AND SET DETAILS HERE
const potAddress = "---- "; //GENERATE ETH WALLET AND SET DETAILS HERE
user_db.defaults({ users: [] }).write();
// ----------- command functions ---------//

// --------ethereum things-----------//
const contractABI = require("./contractABI.json");
abiDecoder.addABI(contractABI);
const tokenAddress = "0x3A1c1d1c06bE03cDDC4d3332F7C20e1B37c97CE9";

// gets web3
const Web3 = require("web3");

// change this to change the network
const network = "mainnet";
// change this to change the infuraKey
const infuraKey = " ---- "; // SET INFURA KEY HERE

// The url with the network and key put in
var web3provider = `https://${network}.infura.io/v3/${infuraKey}`;

// bring this baby together
var web3 = new Web3(new Web3.providers.HttpProvider(web3provider));
// ---------- ethereum things --------------- //

console.log("\x1b[35m%s\x1b[0m", "TIP BOT ONLINE");
console.log("\x1b[35m%s\x1b[0m", "--------------");
console.log("The pot address is currently set to : " + potAddress);
if (admin_ID1 === 0) {
  console.log(
    "You have not set admin ID1, if this is ok carry on, if not please set within tipbot.js"
  );
}
if (admin_ID2 === 0) {
  console.log(
    "You have not set admin ID2, if this is ok carry on, if not please set within tipbot.js"
  );
}

setInterval(function (reply) {
  web3.eth.getBalance(potAddress).then((result) => {
    var ETHbalance = web3.utils.fromWei(result, "ether");
    console.log("ETH balance for fees: " + ETHbalance);
    if (ETHbalance < 0.01) {
      var DM_reply = bot.reply(admin_ID1);
      DM_reply.text("ETH balance for fees: " + ETHbalance);
      DM_reply.text(
        "You need to top up the main account with ETH or withdrawing will fail"
      );
      DM_reply.text(potAddress);
    }
  });
}, 500000);

//filter offline messages
bot.all(function (msg, reply, next) {
  if (!msg.queued) next();
});

// IDs listed in .env for admin only commands.
bot.all(function (msg, reply, next) {
  if (msg.from.id === admin_ID1 || msg.from.id === admin_ID2)
    msg.hasPrivileges = true;
  next();
});

// Emergancy Shutdown
bot.command("halt", function (msg, reply, next) {
  if (!msg.hasPrivileges) {
    console.log(msg.from.id);
    reply.text("lol you cant do that @" + msg.from.username);
    return;
  }
  reply.text("Shutting down the bot.");
  process.exit(0);
});

//help command
bot.command("help", function (msg, reply, next) {
  reply.markdown(
    "Commands:\n\n/register - This will register you with the bot. Please note this will be tied to your UUID and **username.**\n" +
      "\n/tip - Sends tip to person you tag (example : /tip 1 @nanoissuperior)\n" +
      "\n/balance - Shows your current balance\n" +
      "\n/price - Shows the curreny price of one Vybe in USD and ETH\n"
  );
  console.log("help command triggered");
});
//buy command
bot.command("buy", function (msg, reply, next) {
  reply.markdown("[Uniswap link]" + buy);
  console.log("buy command triggered");
});

//price command
bot.command("price", function (msg, reply, next) {
  fetch(`https://api.coingecko.com/api/v3/coins/vybe`)
    .then((res) => res.json())
    .then(
      (result) => {
        console.log("Price request triggered");
        console.log(
          "One VYBE is equal to:\nUSD: $" +
            result.market_data.current_price.usd +
            "\n" +
            "ETH: Ξ" +
            result.market_data.current_price.eth
        );
        reply.markdown(
          "One VYBE is equal to:\nUSD: $" +
            result.market_data.current_price.usd +
            "\n" +
            "ETH: Ξ" +
            result.market_data.current_price.eth +
            "\n\n|| [Buy]" +
            buy +
            " ||"
        );
      },

      (error) => {
        console.log(error);
        reply.markdown("Something went wrong when capturing price");
      }
    );
});

// register command
bot.command("register", function (msg, reply, next) {
  try {
    console.log("User is registering");
    console.log(msg.from);
    console.log("------------------");
    var msgtype = msg.chat.type;
    if (msgtype === "group") {
      reply.markdown(
        "You can't register for a wallet in a group, DM me instead"
      );
    } else if (msg.from.username === undefined) {
      reply.markdown(
        "You must have a username to register, your balance is tied to your username and UUID"
      );
    } else {
      try {
        // Check if user is already registered
        let walletrequest = user_db
          .get("users")
          .find({ user_ID: msg.from.id })
          .value();

        if (walletrequest === undefined) {
          console.log("User has not yet registered, registering now");
          ///Send wallet and key back to user
          reply.markdown("Thanks for registering");
          reply.markdown(
            "Please note : Your funds will be liked to your ID AND USERNAME\nTo deposit funds please use the /deposit command."
          );

          const accountinfo = {
            user_ID: msg.from.id,
            username: msg.from.username,
            balance: 0,
            current_despoit_address: null,
            deposited_transactions: [],
          };
          user_db.get("users").push(accountinfo).write();
        } else {
          console.log(msg.from.username + " is already registered");
          reply.markdown("You are already registered");
        }
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.log(err);
  }
});

//deposit command
bot.command("deposit", function (msg, reply, next) {
  try {
    var sender = msg.from.id;
    console.log(sender);
    var message = msg.text;
    //true if the message includes a deposit address
    var n = message.includes("0x");
    // gets address from the message
    var messageSplit = message.split("0x");
    var depositAddress = "0x" + messageSplit[1];
    let userCheck = user_db.get("users").find({ user_ID: msg.from.id }).value();
    if (msg.chat.type === "group") {
      reply.markdown("You can't deposit in a group");
    } else if (userCheck === undefined) {
      reply.markdown("You need to /register before you can deposit funds");
    } else if (userCheck.current_despoit_address === null) {
      try {
        // checks if they included and ethereum address and if it is 42 letters long
        if (n !== true || depositAddress.length !== 42) {
          reply.markdown(
            "You need to include the Ethereum address (Example 0xcc61...) you will be depositing from."
          );
          reply.markdown("Try /deposit (Your address)");
          console.log(
            "user didn't include ethereum address when trying to deposit"
          );
        } else {
          let checkDatabase = user_db
            .get("users")
            .find({ current_despoit_address: depositAddress })
            .value();

          if (checkDatabase === undefined || null) {
            console.log(sender + "changed their deposit address");
            user_db
              .get("users")
              .find({ user_ID: sender })
              .assign({ current_despoit_address: depositAddress })
              .write();
            reply.markdown("Please send VYBE ONLY to:\n");
            reply.markdown(potAddress);
            reply.markdown(
              "Now waiting for a deposit from: " +
                "\n" +
                depositAddress +
                "\n" +
                "This will remain your deposit address unless you change it."
            );
          } else {
            reply.markdown("An account already uses this address to deposit.");
            console.log(
              "user tried to put an existing address as they deposit address"
            );
          }
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      reply.markdown("To deposit funds send VYBE only to:\n");
      reply.markdown(potAddress);
    }
  } catch (err) {
    console.log(err);
  }
});

//withdraw command
bot.command("withdraw", function (msg, reply, next) {
  try {
    var msgtype = msg.chat.type;
    var sender = msg.from.username;
    console.log(`${sender} is trying to withdraw funds`);
    var text = msg.text;
    var userCheck = user_db.get("users").find({ user_ID: msg.from.id }).value();
    // removes everything after the @ to prevent numbers in username affecting the amount taken
    var textSplit = text.split("0x");

    // amount they want to withdraw with all the letters in the text stripped out including the /tip command
    var withdrawAmount = parseFloat(textSplit[0].match(/[\d\.]+/));

    // address they want to send to
    var destinationAddress = "0x" + textSplit[1];

    if (msgtype === "group") {
      reply.markdown(
        "You can only withdraw your funds in a direct message to me."
      );
    } else if (userCheck === undefined) {
      reply.markdown("You can't withdraw funds without being registered?");
    } else {
      if (withdrawAmount > 0) {
        if (destinationAddress.length === 42) {
          try {
            var userCheck = user_db
              .get("users")
              .find({ user_ID: msg.from.id })
              .value();
            if (userCheck && userCheck.balance >= withdrawAmount) {
              setUpTransaction(potSeed);
            } else {
              reply.markdown("Your balance isn't high enough");
            }

            function setUpTransaction(privateK) {
              // converts the tip amount to wei so it can be loaded into the transaction data (txParams)
              var withdrawInWei = web3.utils.toWei(
                withdrawAmount.toString(),
                "ether"
              );

              // Determine the nonce
              var count = web3.eth.getTransactionCount(potAddress, "pending");

              // Gas price is currently not in use and the gas is hard coded into txParams
              gasPrice = 0;
              web3.eth.getGasPrice(function (error, result) {
                gasPrice = result;

                // sets recpwallet to the recipiant's data.
                // contract data
                var tokenInst = new web3.eth.Contract(
                  contractABI,
                  tokenAddress
                );
                // This is the data which goes into the transaction, whos paying, where its getting paid to and fee ect.
                // Change to token later!!!!!
                let data = tokenInst.methods
                  .transfer(destinationAddress, withdrawInWei)
                  .encodeABI();
                // Withdraw parameters
                const txParams = {
                  nonce: count,
                  from: potAddress,
                  to: tokenAddress,
                  value: "0x00",
                  // all gas price is currently hard coded while testing to make it simpler. For production we will need to add the gasPrice variable
                  gasPrice: gasPrice,
                  gas: "83565",
                  data: data,
                };
                // console log details
                console.log("\x1b[33m%s\x1b[0m", "----- WITHDRAW ----");
                console.log("gasprice: " + gasPrice);
                console.log("amount: " + withdrawAmount);
                console.log("amountRaw: " + withdrawInWei);
                // the function called bellow triggers the sendTransaction function which is the final step.
                sendTransaction(txParams, privateK);
              });
            }

            function sendTransaction(txParams, privateK) {
              console.log("\x1b[35m%s\x1b[0m", "Transaction pending");
              reply.markdown("Pending Transaction");
              // This signs the trasaction using the senders private key
              const signPromise = web3.eth.accounts.signTransaction(
                txParams,
                privateK
              );
              // once the transaction is signed
              signPromise
                .then((signedTx) => {
                  console.log("transactionHash: " + signedTx.transactionHash);
                  // sends the transaction to the network
                  const sentTx = web3.eth.sendSignedTransaction(
                    signedTx.rawTransaction.toString("hex")
                  );
                  user_db
                    .get("users")
                    .find({ user_ID: msg.from.id })
                    .assign({
                      balance: parseFloat(
                        (userCheck.balance - withdrawAmount).toFixed(8)
                      ),
                    })
                    .write();
                  // Returns receipt to console
                  sentTx.on("receipt", (receipt) => {
                    console.log(
                      "\x1b[35m%s\x1b[0m",
                      "Withdraw success " +
                        sender +
                        " has been sent the receipt"
                    );
                    console.log("\x1b[33m%s\x1b[0m", "---------------------");
                    reply.markdown(
                      "You have withdrawn " +
                        withdrawAmount +
                        " VYBE to " +
                        destinationAddress
                    );
                    reply.markdown(
                      "https://rinkeby.etherscan.io/tx/" +
                        receipt.transactionHash
                    );
                  });
                  // Tells you why it broke
                  sentTx.on("error", (err) => {
                    console.log(err);
                    reply.markdown("FAILED TRANSACTION");
                    user_db
                      .get("users")
                      .find({ user_ID: msg.from.id })
                      .assign({
                        balance: parseFloat(
                          (userCheck.balance + withdrawAmount).toFixed(8)
                        ),
                      })
                      .write();
                  });
                })
                .catch((err) => {
                  console.log(err);
                });
            }
            //if balance ok withdraw
            // else no withdraw
          } catch (err) {
            console.log(err);
          }
        } else {
          reply.markdown(
            "Please enter make sure you put an ethereum address in your request\n" +
              "/withdraw AMOUNT ADDRESS"
          );
        }
      } else {
        reply.markdown("Something was wrong with the amount");
      }
    }
  } catch (err) {
    console.log(err);
  }
});

//balance command
bot.command("balance", function (msg, reply, text) {
  try {
    console.log("Balance check for " + msg.from.username);
    var msgtype = msg.chat.type;
    var user = msg.from.username;
    var userid = msg.from.id;
    var userCheck = user_db.get("users").find({ user_ID: msg.from.id }).value();
    if (msgtype === "group") {
      reply.markdown("Your balance will not be shown in public groups");
    } else if (userCheck === undefined) {
      reply.markdown("You cant check your balance, you must first /register");
    } else {
      let walletrequest = user_db
        .get("users")
        .find({ user_ID: msg.from.id })
        .value();
      var balance = walletrequest.balance;

      fetch(`https://api.coingecko.com/api/v3/coins/vybe`)
        .then((res) => res.json())
        .then(
          (result) => {
            reply.markdown(
              "Your balance is: " +
                balance +
                " VYBE" +
                "\n" +
                "Which is worth: $" +
                result.market_data.current_price.usd * balance
            );
            console.log("Their balance is: " + balance);
          },

          (error) => {
            console.log(error);
            reply.markdown("Something went wrong when capturing price");
          }
        );
    }
  } catch (err) {
    console.log(err);
  }
});

// Test tips now made the actual tip
bot.command("tip", function (msg, reply, next) {
  try {
    var sender = msg.from.id;
    var recp = msg.mentions.raw[0];
    console.log(msg.from.username + " wants to tip " + recp);
    //check recp is registered with username check
    let recpcheck = user_db.get("users").find({ username: recp }).value();
    let sendercheck = user_db.get("users").find({ user_ID: sender }).value();

    // Extract number from msg (amount being tipped)
    var text = msg.text;
    var textSplit = text.split("@")[0];
    var tipAmount = parseFloat(textSplit.match(/[\d\.]+/));
    var userCheck = user_db.get("users").find({ user_ID: msg.from.id }).value();
    // checks if the tip request includes a $ symbol so we can decide whether to calculate in vybe or usd
    var n = text.includes("$");
    if (recp === undefined) {
      reply.markdown(
        "You didnt tell me who you want to tip, try again ( example :  /tip 1 @nanoissuperior )"
      );
    } else if (recp === "vybe_tipbot") {
      console.log("bot was tipped");
      //add in self tip
    } else if (recp === msg.from.username) {
      reply.markdown("Why would you want to tip yourself?");
    } else if (recpcheck === undefined) {
      console.log(recp + " is not registered");
      reply.markdown(recp + " is not registered so this tip could not be sent");
    } else if (userCheck === undefined) {
      reply.markdown("You cant tip. you need to first /register");
    } else {
      try {
        //check sender is registered and if the balance is ok
        console.log(
          msg.from.username + " has a balance of " + sendercheck.balance
        );

        if (sendercheck === undefined) {
          console.log(sender + " is not registered");
          reply.markdown("You are not registered, how would I send a tip?");
        } else {
          if (tipAmount >= 0.000001) {
            var vybePrice = null;
            // checks if they wanted to tip with usd as the unit of account
            if (n === true) {
              fetch(`https://api.coingecko.com/api/v3/coins/vybe`)
                .then((res) => res.json())
                .then(
                  (result) => {
                    vybePrice = result.market_data.current_price.usd;
                    tipAmount = parseFloat((tipAmount / vybePrice).toFixed(8));
                    if (
                      sendercheck.balance <= parseFloat(tipAmount.toFixed(8))
                    ) {
                      console.log("Balance not high enough");
                      // send message to notify tip could not be sent
                      reply.markdown("Tip Failed.");
                      //dm to recp
                      var DM_reply = bot.reply(msg.from.id);
                      DM_reply.text(
                        "You do not have a high enough /balance to process that tip."
                      );
                    } else {
                      reply.markdown(tipAmount.toFixed(8) + " VYBE sent");
                      //dm to recp
                      var recpID = recpcheck.user_ID;
                      console.log(
                        "\x1b[35m%s\x1b[0m",
                        tipAmount + " sent to " + recpcheck.username
                      );
                      console.log("sending DM to " + recpcheck.username);
                      var DM_reply = bot.reply(recpID);
                      DM_reply.text(
                        "You just recived a tip of " +
                          tipAmount +
                          " vybe from @" +
                          msg.from.username
                      );
                      //process tip
                      var newSenderBalance =
                        parseFloat(sendercheck.balance) - parseFloat(tipAmount);
                      var newRecpBalance =
                        parseFloat(recpcheck.balance) + parseFloat(tipAmount);
                      // adds new values to db
                      user_db
                        .get("users")
                        .find({ username: recp })
                        .assign({
                          balance: parseFloat(newRecpBalance.toFixed(8)),
                        })
                        .write();
                      user_db
                        .get("users")
                        .find({ username: sendercheck.username })
                        .assign({
                          balance: parseFloat(newSenderBalance.toFixed(8)),
                        })
                        .write();
                    }
                  },

                  (error) => {
                    console.log(error);
                    reply.markdown("Something went wrong when capturing price");
                  }
                );
              // standard vybe value tip
            } else {
              if (sendercheck.balance < parseFloat(tipAmount.toFixed(8))) {
                console.log("Balance not high enough");
                // send message to notify tip could not be sent
                reply.markdown("Tip Failed.");
                //dm to recp
                var DM_reply = bot.reply(msg.from.id);
                DM_reply.text(
                  "You do not have a high enough /balance to process that tip."
                );
              } else {
                reply.markdown(tipAmount.toFixed(8) + " VYBE sent");
                //dm to recp
                var recpID = recpcheck.user_ID;
                console.log(
                  "\x1b[35m%s\x1b[0m",
                  tipAmount + " sent to " + recpcheck.username
                );
                console.log("sending DM to " + recpcheck.username);
                var DM_reply = bot.reply(recpID);
                DM_reply.text(
                  "You just recived a tip of " +
                    tipAmount +
                    " vybe from @" +
                    msg.from.username
                );

                //process tip
                var newSenderBalance =
                  parseFloat(sendercheck.balance) - tipAmount;
                var newRecpBalance = parseFloat(recpcheck.balance) + tipAmount;
                // adds new values to db
                user_db
                  .get("users")
                  .find({ username: recp })
                  .assign({ balance: parseFloat(newRecpBalance.toFixed(8)) })
                  .write();
                user_db
                  .get("users")
                  .find({ username: sendercheck.username })
                  .assign({ balance: parseFloat(newSenderBalance.toFixed(8)) })
                  .write();
              }
            }
          } else {
            reply.markdown(
              "Try again ...\n Example: /tip 2 @username \n Minimum: 0.000001"
            );
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.log(err);
  }
});

//Update Username
bot.command("username", function (msg, reply, next) {
  try {
    var msgtype = msg.chat.type;
    console.log("username update for" + msg.from.id);
    let usernameupdate = user_db
      .get("users")
      .find({ user_ID: msg.from.id })
      .value();
    if (usernameupdate === undefined) {
      reply.markdown(
        "It looks like you are not registered with me, if you think this is a mistake please contact one of the Admins"
      );
    } else if (msgtype === "group") {
      reply.markdown("You can only update your username in a DM to me");
    } else if (usernameupdate.username === undefined) {
      reply.markdown("You do not have a username set");
    } else {
      reply.markdown("You have updated your username to " + msg.from.username);
      console.log(
        usernameupdate.username +
          " is chaning their username to " +
          msg.from.username
      );
      user_db
        .get("users")
        .find({ user_ID: msg.from.id })
        .assign({ username: msg.from.username })
        .write();
    }
  } catch (err) {
    console.log(err);
  }
});

/// unknown command show error
bot.command((msg, reply) =>
  reply.text(
    "Hmm, i dont recognise that command, did you need me? If so retry your command or /help. to see what I can do"
  )
);

// ---------- WEBSOCKET ----------- //
// --------ethereum things-----------//
// Address being tracked by the websocket
const addressW = potAddress.split("0x").pop();

// The url with the network and key put in
var web3providerW = `wss://${network}.infura.io/ws/v3/${infuraKey}`;

// bring this baby together
var web3W = new Web3(new Web3.providers.WebsocketProvider(web3providerW));
// block number
var block = user_db.get("block").value();

// ---------- ethereum things --------------- //
var websocket = web3W.eth.subscribe(
  "logs",
  {
    address: tokenAddress,
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ,
      "0x000000000000000000000000" + addressW,
    ],
    fromBlock: block,
  },
  function (error, result) {
    if (!error) {
      web3.eth.getTransaction(result.transactionHash, function (e, receipt) {
        if (!e) {
          console.log("\x1b[33m%s\x1b[0m", "------- DEPOSIT ------");
          console.log("blockNumber: " + receipt.blockNumber);
          console.log("transactionHash: " + result.transactionHash);
          console.log("fromAddress: " + receipt.from);
          const decodedData = abiDecoder.decodeMethod(receipt.input);
          console.log(
            "amount: " +
              decodedData.params[1].value / 1000000000000000000 +
              " VYBE"
          );
          depositBalance(
            receipt.from,
            decodedData.params[1].value / 1000000000000000000,
            result.transactionHash
          );
          updateBlock(receipt.blockNumber);
        } else {
          console.log(e);
        }
      });
    } else {
      console.log(error);
    }
  }
);

function depositBalance(addressFrom, amount, hash) {
  // checks is this deposit was made by one of our users and if so grabs their details
  var isADepositAddress = user_db
    .get("users")
    .find({ current_despoit_address: addressFrom })
    .value();

  if (isADepositAddress && amount > 0) {
    // checks if we already logged the transaction
    var depositCheck = user_db
      .get("users")
      .find({ deposited_transactions: [hash] })
      .value();
    if (depositCheck) {
      console.log("TRANSACTION ALREADY LOGGED");
    } else {
      let deposited_transactions = user_db
        .get("users")
        .find({ current_despoit_address: addressFrom })
        .get("deposited_transactions")
        .value();
      user_db
        .get("users")
        .find({ current_despoit_address: addressFrom })
        .assign({
          balance: parseFloat(
            parseFloat(isADepositAddress.balance) +
              parseFloat(amount.toFixed(8))
          ),
        })
        .write();
      // logs the deposited transaction so we dont duplicate later
      deposited_transactions.push(hash);
      user_db
        .get("users")
        .find({ current_despoit_address: addressFrom })
        .assign({ deposited_transactions })
        .write();
    }
  } else {
    console.log(
      "\x1b[41m%s\x1b[0m",
      "TRANSACTION FROM ADDRESS NOT ON DATABASE OR AMOUNT 0"
    );
  }
  console.log("\x1b[33m%s\x1b[0m", "----------------------");
}

function updateBlock(blocknumber) {
  var blockNumberInDB = user_db.get("block").value();
  if (blockNumberInDB < blocknumber) {
    user_db.assign({ block: blocknumber }).write();

    console.log("Block updated " + blocknumber);
  }
}
