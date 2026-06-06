import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  List<dynamic> listings = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _fetchListings();
  }

  Future<void> _fetchListings() async {
    try {
      final res = await http.get(Uri.parse('http://localhost:4000/api/marketplace/listings'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          listings = data['listings'] ?? [];
          isLoading = false;
        });
      } else {
        setState(() {
          error = 'Failed to load listings';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Network error: $e';
        isLoading = false;
      });
    }
  }

  void _showBidDialog(Map<dynamic, dynamic> listing) {
    final TextEditingController amountController = TextEditingController();
    final double minBid = (listing['currentBid'] ?? listing['basePrice'] ?? 0) + 1.0;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          title: Text(
            'Place Bid on ${listing['model']}',
            style: const TextStyle(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Current highest bid: \$${listing['currentBid'] ?? listing['basePrice']}',
                style: const TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Your Bid (Min: \$$minBid)',
                  labelStyle: const TextStyle(color: Colors.white54),
                  enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                  focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.blue)),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            ),
            ElevatedButton(
              onPressed: () async {
                final amount = double.tryParse(amountController.text);
                if (amount != null && amount >= minBid) {
                  Navigator.pop(context);
                  await _placeBid(listing['id'], amount);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Bid must be at least \$$minBid')),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6)),
              child: const Text('Place Bid', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  Future<void> _placeBid(String listingId, double amount) async {
    try {
      final res = await http.post(
        Uri.parse('http://localhost:4000/api/marketplace/listings/$listingId/bid'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'buyerId': 'customer-id', // TODO: Use real user ID
          'amount': amount,
        }),
      );

      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Bid placed successfully!')),
        );
        _fetchListings(); // Refresh listings to show new current bid
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to place bid')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Marketplace', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : error != null
              ? Center(child: Text(error!, style: const TextStyle(color: Colors.redAccent)))
              : listings.isEmpty
                  ? const Center(child: Text('No devices available for sale.', style: TextStyle(color: Colors.white54)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: listings.length,
                      itemBuilder: (context, index) {
                        final item = listings[index];
                        return Card(
                          color: const Color(0xFF0F172A),
                          margin: const EdgeInsets.only(bottom: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${item['make']} ${item['model']} (${item['storage']})',
                                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Condition: ${item['condition']}',
                                  style: const TextStyle(color: Colors.white70),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Current Bid',
                                          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12),
                                        ),
                                        Text(
                                          '\$${item['currentBid'] ?? item['basePrice']}',
                                          style: const TextStyle(color: Color(0xFF10B981), fontSize: 20, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                    ElevatedButton(
                                      onPressed: () => _showBidDialog(item),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF3B82F6),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      child: const Text('Bid Now', style: TextStyle(color: Colors.white)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
